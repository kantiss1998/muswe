import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockUpload = vi.fn()
const mockGetPublicUrl = vi.fn()

vi.mock('../client', () => ({
  createBrowserClient: () => ({
    storage: {
      from: () => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
  }),
}))

describe('Supabase Storage WebP conversion & upload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpload.mockResolvedValue({ error: null })
    mockGetPublicUrl.mockImplementation((fileName: string) => ({
      data: {
        publicUrl: `https://xsuujkceybfgdvlfhhmh.supabase.co/storage/v1/object/public/products/${fileName}`,
      },
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('converts large raster images to WebP, scales down oversized dimensions, and sets 1-year cacheControl', async () => {
    const mockDrawImage = vi.fn()
    const mockClose = vi.fn()
    const webpBlob = new Blob(['webp-bytes'], { type: 'image/webp' })

    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({ drawImage: mockDrawImage })),
      toBlob: vi.fn((cb: (b: Blob | null) => void, mime: string, quality: number) => {
        expect(mime).toBe('image/webp')
        expect(quality).toBe(0.85)
        cb(webpBlob)
      }),
    }

    vi.stubGlobal('window', {})
    vi.stubGlobal('document', { createElement: vi.fn(() => mockCanvas) })
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ width: 3200, height: 1600, close: mockClose }))
    )

    const { uploadImage } = await import('../storage')
    const jpgFile = new File([new Uint8Array(1024)], 'Baju Lebaran.JPG', {
      type: 'image/jpeg',
    })

    const url = await uploadImage(jpgFile, 'products')

    expect(mockCanvas.width).toBe(1600)
    expect(mockCanvas.height).toBe(800)
    expect(mockClose).toHaveBeenCalledTimes(1)
    expect(mockUpload).toHaveBeenCalledTimes(1)

    const [uploadedName, uploadedFile, uploadOpts] = mockUpload.mock.calls[0]
    expect(uploadedName).toMatch(/\.webp$/)
    expect(uploadedFile.type).toBe('image/webp')
    expect(uploadOpts).toEqual({
      cacheControl: '31536000',
      contentType: 'image/webp',
      upsert: true,
    })
    expect(url).toMatch(/^https:\/\/cdn\.muswedaily\.com\/products\/.*\.webp$/)
  })

  it('skips WebP conversion for SVG and small WebP files', async () => {
    const createBitmapSpy = vi.fn()
    vi.stubGlobal('window', {})
    vi.stubGlobal('document', { createElement: vi.fn() })
    vi.stubGlobal('createImageBitmap', createBitmapSpy)

    const { convertImageToWebP } = await import('../storage')

    const svgFile = new File(['<svg/>'], 'logo.svg', { type: 'image/svg+xml' })
    const smallWebp = new File([new Uint8Array(50 * 1024)], 'photo.webp', {
      type: 'image/webp',
    })

    expect(await convertImageToWebP(svgFile)).toBe(svgFile)
    expect(await convertImageToWebP(smallWebp)).toBe(smallWebp)
    expect(createBitmapSpy).not.toHaveBeenCalled()
  })
})
