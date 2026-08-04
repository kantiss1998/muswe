import { SupabaseClient } from '@supabase/supabase-js'
import { safeLogError } from '../logger'
import { createBrowserClient } from './client'

/**
 * Uploads an image file to Supabase Storage and returns its public URL.
 * @param file The file to upload
 * @param bucket The storage bucket name (defaults to 'products')
 */
export async function uploadImage(file: File, bucket: string = 'products'): Promise<string> {
  const supabase = createBrowserClient()
  const targetBucket = bucket.toLowerCase()

  // Clean file name to prevent issues with special characters
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const fileName = `${crypto.randomUUID()}_${cleanName}`

  const { error } = await supabase.storage.from(targetBucket).upload(fileName, file, {
    cacheControl: '3600',
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
