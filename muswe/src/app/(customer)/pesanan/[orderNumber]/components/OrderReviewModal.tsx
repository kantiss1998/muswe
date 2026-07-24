/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
import React, { useState } from 'react'
import { Modal, Button, Input, Textarea, Checkbox } from '@/shared/components'
import { Image as ImageIcon, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { uploadImage } from '@/lib/supabase/storage'
import { createBrowserClient } from '@/lib/supabase/client'
import { useTranslation } from '@/shared/i18n/useTranslation'

interface OrderReviewModalProps {
  selectedReviewItem: any
  onClose: () => void
  user: any
  submitReviewMutation: any
  refetch: () => void
}

export function OrderReviewModal({
  selectedReviewItem,
  onClose,
  user,
  submitReviewMutation,
  refetch,
}: OrderReviewModalProps): React.JSX.Element {
  const { isEnglish } = useTranslation()
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewBody, setReviewBody] = useState('')
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewAnonymous, setReviewAnonymous] = useState(false)
  const [reviewFiles, setReviewFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const supabase = createBrowserClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files)
      if (reviewFiles.length + selected.length > 2) {
        toast.error(isEnglish ? 'Maximum 2 photos allowed' : 'Maksimal hanya 2 foto yang diperbolehkan')
        return
      }

      const validFiles = selected.filter((f) => f.type.startsWith('image/'))
      if (validFiles.length !== selected.length) {
        toast.error(isEnglish ? 'Only image files are allowed' : 'Hanya file gambar yang diperbolehkan')
      }

      const smallFiles = validFiles.filter((f) => f.size <= 2 * 1024 * 1024)
      if (smallFiles.length !== validFiles.length) {
        toast.error(isEnglish ? 'Maximum size per photo is 2MB' : 'Ukuran maksimal per foto adalah 2MB')
      }

      setReviewFiles((prev) => [...prev, ...smallFiles].slice(0, 2))
    }
  }

  const removeFile = (idx: number) => {
    setReviewFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReviewItem || !user?.id) return
    if (!reviewBody.trim()) {
      toast.error(isEnglish ? 'Please write your review thoughts' : 'Silakan isi ulasan Anda')
      return
    }

    try {
      let finalProductId = selectedReviewItem.product_id

      // If product_id is not directly on item, fetch it from variant
      if (!finalProductId && selectedReviewItem.variant_id) {
        const { data: variantData } = await supabase
          .from('product_variants')
          .select('product_id')
          .eq('id', selectedReviewItem.variant_id)
          .single()
        if (variantData) {
          finalProductId = variantData.product_id
        }
      }

      if (!finalProductId) {
        toast.error(isEnglish ? 'Failed to verify product details' : 'Gagal memverifikasi informasi produk')
        return
      }

      setIsUploading(true)
      const mediaUrls: string[] = []

      try {
        for (const file of reviewFiles) {
          const url = await uploadImage(file, 'products')
          mediaUrls.push(url)
        }
      } catch (uploadErr: any) {
        toast.error(uploadErr.message || (isEnglish ? 'Failed to upload review photo' : 'Gagal mengunggah foto review'))
        setIsUploading(false)
        return
      }

      const res = await submitReviewMutation.mutateAsync({
        orderItemId: selectedReviewItem.id,
        productId: finalProductId,
        variantId: selectedReviewItem.variant_id || null,
        userId: user.id,
        rating: reviewRating,
        title: reviewTitle || undefined,
        body: reviewBody,
        isAnonymous: reviewAnonymous,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
      })

      setIsUploading(false)

      if (res && res.success) {
        toast.success(isEnglish ? 'Review submitted successfully!' : 'Ulasan berhasil dikirim!')
        refetch()
        onClose()
      } else {
        toast.error(isEnglish ? 'Failed to submit review' : 'Gagal mengirimkan ulasan')
      }
    } catch (err) {
      console.error(err)
      setIsUploading(false)
      toast.error(isEnglish ? 'An error occurred while submitting review' : 'Terjadi kesalahan saat mengirimkan ulasan')
    }
  }

  return (
    <Modal
      isOpen={selectedReviewItem !== null}
      onClose={onClose}
      title={isEnglish ? 'Write Product Review' : 'Tulis Ulasan Produk'}
      size="md"
    >
      {selectedReviewItem && (
        <form onSubmit={handleSubmitReview} className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-brand-gold font-semibold mb-1">
              {isEnglish ? 'Product Name' : 'Nama Produk'}
            </p>
            <h4 className="text-sm font-semibold text-neutral-800 font-heading">
              {selectedReviewItem.product_name}
            </h4>
            {selectedReviewItem.variant_name && (
              <p className="text-xs text-neutral-500 mt-0.5">
                {isEnglish ? 'Variant:' : 'Varian:'} {selectedReviewItem.variant_name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-2">
              {isEnglish ? 'Product Rating' : 'Rating Produk'}
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <span
                    className={`text-2xl ${star <= reviewRating ? 'text-amber-400' : 'text-neutral-200'}`}
                  >
                    ★
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Input
              label={isEnglish ? 'Review Title (Optional)' : 'Judul Ulasan (Opsional)'}
              type="text"
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
              placeholder={isEnglish ? 'e.g. Excellent quality!' : 'Contoh: Kualitas sangat baik!'}
            />
          </div>

          <div className="space-y-1">
            <Textarea
              label={isEnglish ? 'Review Details' : 'Isi Ulasan'}
              value={reviewBody}
              onChange={(e) => setReviewBody(e.target.value)}
              rows={4}
              required
              placeholder={isEnglish ? 'Write your thoughts about this product...' : 'Tulis pendapat Anda tentang produk ini...'}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="is-anonymous"
              checked={reviewAnonymous}
              onChange={(e) => setReviewAnonymous(e.target.checked)}
            />
            <label
              htmlFor="is-anonymous"
              className="text-xs text-neutral-600 select-none cursor-pointer"
            >
              {isEnglish ? 'Post as Anonymous (Hide your name)' : 'Kirim sebagai Anonim (Sembunyikan nama Anda)'}
            </label>
          </div>

          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-wider text-neutral-500 font-semibold">
              {isEnglish ? 'Attach Photos (Max 2 Photos, 2MB/Photo)' : 'Lampirkan Foto (Maks 2 Foto, 2MB/Foto)'}
            </label>

            <div className="flex flex-wrap gap-3">
              {reviewFiles.map((file, idx) => (
                <div key={idx} className="relative w-20 h-20 border border-neutral-200">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${idx}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-sm"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {reviewFiles.length < 2 && (
                <label className="w-20 h-20 border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center text-neutral-400 hover:text-brand-gold hover:border-brand-gold cursor-pointer transition-colors">
                  <ImageIcon size={20} className="mb-1" />
                  <span className="text-sm uppercase tracking-wider font-semibold">{isEnglish ? 'Add' : 'Tambah'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 py-3 text-xs uppercase tracking-wider font-semibold border-neutral-300 text-neutral-700 hover:bg-neutral-50"
            >
              {isEnglish ? 'Cancel' : 'Batal'}
            </Button>
            <Button
              type="submit"
              isLoading={submitReviewMutation.isPending || isUploading}
              disabled={submitReviewMutation.isPending || isUploading}
              className="flex-1 py-3 text-xs uppercase tracking-wider font-semibold"
            >
              {isUploading ? (isEnglish ? 'Uploading...' : 'Mengunggah...') : (isEnglish ? 'Submit Review' : 'Kirim Ulasan')}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
