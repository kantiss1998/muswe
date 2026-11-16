import { SupabaseClient } from '@supabase/supabase-js'
import { safeLogError } from '../logger'
import { createBrowserClient } from './client'

const MAX_DIMENSION_BY_BUCKET: Record<string, number> = {
  banners: 1920,
  products: 1600,
}

const WEBP_QUALITY_BY_BUCKET: Record<string, number> = {
  banners: 0.88,
  products: 0.85,
}

const SKIP_CONVERT_MIME_TYPES = new Set(['image/svg+xml', 'image/gif'])
const SMALL_WEBP_THRESHOLD_BYTES = 350 * 1024

function toWebpFileName(originalName: string): string {
  const baseName = originalName.replace(/\.[^/.]+$/, '')
  return `${baseName}.webp`
}

async function decodeImageSource(
  file: File
): Promise<{ source: CanvasImageSource; width: number; height: number; cleanup: () => void }> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file)
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      cleanup: () => bitmap.close(),
    }
  }

  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Failed to decode image'))
      el.src = objectUrl
    })
    return {
      source: img,
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      cleanup: () => URL.revokeObjectURL(objectUrl),
    }
  } catch (err) {
    URL.revokeObjectURL(objectUrl)
    throw err
  }
}

/**
 * Resizes and converts raster images to WebP in the browser before uploading to Supabase Storage.
 * Falls back cleanly to the original file for SVGs, GIFs, small WebPs, or unsupported environments.
 */
export async function convertImageToWebP(
  file: File,
  maxDimension: number = 1600,
  quality: number = 0.85
): Promise<File> {
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    !file.type.startsWith('image/') ||
    SKIP_CONVERT_MIME_TYPES.has(file.type)
  ) {
    return file
  }

  if (file.type === 'image/webp' && file.size <= SMALL_WEBP_THRESHOLD_BYTES) {
    return file
  }

  try {
    const { source, width, height, cleanup } = await decodeImageSource(file)
    try {
      if (!width || !height) return file

      const longestSide = Math.max(width, height)
      const scale = longestSide > maxDimension ? maxDimension / longestSide : 1
      const targetWidth = Math.max(1, Math.round(width * scale))
      const targetHeight = Math.max(1, Math.round(height * scale))

      const canvas = document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = targetHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return file

      ctx.drawImage(source, 0, 0, targetWidth, targetHeight)

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/webp', quality)
      )

      if (!blob || blob.type !== 'image/webp') {
        return file
      }

      // Avoid inflating already-WebP images that did not shrink after re-encoding
      if (file.type === 'image/webp' && blob.size >= file.size) {
        return file
      }

      return new File([blob], toWebpFileName(file.name), {
        type: 'image/webp',
        lastModified: Date.now(),
      })
    } finally {
      cleanup()
    }
  } catch (err) {
    safeLogError('Client WebP conversion fallback to original file:', err)
    return file
  }
}

/**
 * Uploads an image file to Supabase Storage (converting raster images to WebP first) and returns its CDN URL.
 * @param file The file to upload
 * @param bucket The storage bucket name (defaults to 'products')
 */
export async function uploadImage(file: File, bucket: string = 'products'): Promise<string> {
  const supabase = createBrowserClient()
  const targetBucket = bucket.toLowerCase()

  const maxDimension = MAX_DIMENSION_BY_BUCKET[targetBucket] ?? 1600
  const quality = WEBP_QUALITY_BY_BUCKET[targetBucket] ?? 0.85
  const preparedFile = await convertImageToWebP(file, maxDimension, quality)

  // Clean file name to prevent issues with special characters
  const cleanName = preparedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const fileName = `${crypto.randomUUID()}_${cleanName}`

  const { error } = await supabase.storage.from(targetBucket).upload(fileName, preparedFile, {
    cacheControl: '31536000',
    contentType: preparedFile.type || undefined,
    upsert: true,
  })

  if (error) {
    safeLogError('Storage upload error', error)
    throw new Error(
      'Gagal mengunggah gambar. Silakan periksa ukuran dan format gambar atau coba lagi nanti.'
    )
  }

  const { data: urlData } = supabase.storage.from(targetBucket).getPublicUrl(fileName)

  if (!urlData?.publicUrl) {
    throw new Error('Gagal mendapatkan URL publik dari file.')
  }

  // Gunakan CDN custom
  const cdnUrl = urlData.publicUrl.replace(
    /https:\/\/[a-zA-Z0-9]+\.supabase\.co\/storage\/v1\/object\/public/,
    'https://cdn.muswedaily.com'
  )

  return cdnUrl
}

/**
 * Deletes an image from Supabase Storage using its public URL.
 * @param supabase The Supabase client instance
 * @param url The public URL of the image
 * @param bucket The storage bucket name (defaults to 'products')
 */
export async function deleteImageByUrl(
  supabase: SupabaseClient,
  url: string,
  bucket: string = 'products'
): Promise<void> {
  try {
    if (!url) return

    // Extract file path after bucket name from URL.
    // CDN URL format:  https://cdn.muswedaily.com/<bucket>/<path>
    // Supabase URL:    https://<id>.supabase.co/storage/v1/object/public/<bucket>/<path>
    // We need to extract everything after the bucket segment.
    const targetBucket = bucket.toLowerCase()
    let filePath: string | null = null

    // Try CDN URL pattern
    const cdnMatch = url.match(new RegExp(`cdn\\.muswedaily\\.com\\/${targetBucket}\\/(.+)`))
    if (cdnMatch) {
      filePath = cdnMatch[1]
    } else {
      // Try Supabase URL pattern
      const supabaseMatch = url.match(
        new RegExp(`\\/object\\/public\\/${targetBucket}\\/(.+)`)
      )
      if (supabaseMatch) {
        filePath = supabaseMatch[1]
      } else {
        // Fallback: take everything after the last slash (original behavior)
        const urlParts = url.split('/')
        filePath = urlParts[urlParts.length - 1] || null
      }
    }

    if (!filePath) return

    const { error } = await supabase.storage.from(bucket).remove([filePath])
    if (error) {
      safeLogError(`Failed to delete image ${filePath} from ${bucket}:`, error.message)
    }
  } catch (err) {
    safeLogError('Error in deleteImageByUrl:', err)
  }
}
