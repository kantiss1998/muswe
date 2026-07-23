'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { MapPin, Truck, Plus, Check } from 'lucide-react'
import { Button, Textarea } from '@/shared/components'
import { formatIDR } from '@/lib/utils'
import type { UserAddress, ShippingOption } from '@/modules/shipping/types'

interface CheckoutAddressFormProps {
  addresses: UserAddress[]
  selectedAddress: UserAddress | null
  onSelectAddress: (addr: UserAddress) => void
  onAddNewAddress: () => void
  addressesLoading: boolean
  shippingOptions: ShippingOption[]
  selectedCourier: ShippingOption | null
  onSelectCourier: (courier: ShippingOption) => void
  shippingLoading: boolean
  shippingError?: string | null
  isRatesCalculated: boolean
  onCalculateShipping: () => void
  notes: string
  onNotesChange: (notes: string) => void
}

export function CheckoutAddressForm({
  addresses,
  selectedAddress,
  onSelectAddress,
  onAddNewAddress,
  addressesLoading,
  shippingOptions,
  selectedCourier,
  onSelectCourier,
  shippingLoading,
  shippingError,
  isRatesCalculated,
  onCalculateShipping,
  notes,
  onNotesChange,
}: CheckoutAddressFormProps): React.JSX.Element {
  return (
    <div className="space-y-8">
      {/* Address Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-wider font-heading font-bold text-brand-black flex items-center">
            <MapPin size={14} className="mr-2 text-neutral-500" /> Alamat Pengiriman
          </h2>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAddNewAddress}
            className="inline-flex items-center text-sm text-neutral-600 hover:text-brand-black font-heading font-medium uppercase tracking-wider transition-colors duration-200"
          >
            <Plus size={12} className="mr-1" /> Tambah Alamat
          </motion.button>
        </div>

        {addressesLoading ? (
          <div className="h-24 bg-neutral-100 animate-pulse rounded-none" />
        ) : addresses && addresses.length > 0 ? (
          <div className="space-y-3">
            {/* Selected Address Display */}
            {selectedAddress ? (
              <motion.div
                layoutId="selectedAddressBox"
                className="border border-brand-gold bg-brand-gold-muted/10 p-4 relative rounded-none shadow-sm"
              >
                <p className="font-heading font-semibold text-xs text-brand-gold uppercase tracking-wider">
                  {selectedAddress.label} (Pilihan)
                </p>
                <p className="font-sans font-medium text-neutral-700 mt-1.5">
                  {selectedAddress.recipient_name} | {selectedAddress.phone}
                </p>
                <p className="text-neutral-500 text-xs mt-1 leading-relaxed">
                  {selectedAddress.full_address}
                </p>
                <p className="text-xs text-neutral-400 mt-1 font-sans">
                  {selectedAddress.district_name}, {selectedAddress.city_name},{' '}
                  {selectedAddress.province_name} {selectedAddress.postal_code}
                </p>
              </motion.div>
            ) : (
              <p className="text-sm text-red-500 font-medium">
                Harap pilih atau tambahkan alamat baru
              </p>
            )}

            {/* Other Addresses */}
            {addresses.length > 1 && (
              <div className="border border-neutral-200 p-4 space-y-3 bg-white">
                <p className="text-xs text-neutral-400 font-heading font-medium uppercase tracking-wider">
                  Pilih Alamat Lain:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                  {addresses
                    .filter((a) => a.id !== selectedAddress?.id)
                    .map((address) => (
                      <motion.div
                        whileHover={{ y: -1, borderColor: '#171717' }}
                        whileTap={{ scale: 0.98 }}
                        key={address.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => onSelectAddress(address)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            onSelectAddress(address)
                          }
                        }}
                        className="p-3 border border-neutral-200 text-xs cursor-pointer bg-white transition-all duration-200"
                      >
                        <p className="font-heading font-medium text-xs text-brand-black uppercase tracking-wider">
                          {address.label}
                        </p>
                        <p className="font-sans text-neutral-700 mt-1 font-medium">
                          {address.recipient_name}
                        </p>
                        <p className="text-neutral-500 truncate mt-0.5 text-sm">
                          {address.full_address}
                        </p>
                      </motion.div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-neutral-200">
            <p className="text-xs text-neutral-400 mb-3">Belum ada alamat pengiriman.</p>
            <Button
              onClick={onAddNewAddress}
              variant="outline"
              className="text-xs uppercase font-semibold"
            >
              Tambah Alamat Pertama
            </Button>
          </div>
        )}
      </div>

      {/* Shipping Method Section */}
      <div className="space-y-4 pt-4 border-t border-neutral-100">
        <h2 className="text-xs uppercase tracking-wider font-heading font-bold text-brand-black flex items-center">
          <Truck size={14} className="mr-2 text-neutral-500" /> Opsi Pengiriman
        </h2>

        {!selectedAddress ? (
          <p className="text-xs text-neutral-400 italic">
            Harap pilih alamat terlebih dahulu untuk menampilkan opsi pengiriman.
          </p>
        ) : !selectedAddress.postal_code || selectedAddress.postal_code.trim().length === 0 ? (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium rounded-none">
            Alamat yang Anda pilih belum memiliki **Kode Pos**. Harap perbarui alamat atau pilih alamat yang menyertakan kode pos 5 digit agar tarif Biteship dapat dihitung.
          </div>
        ) : !isRatesCalculated ? (
          <div className="border border-neutral-200 bg-neutral-50/70 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-none">
            <div>
              <p className="text-xs font-heading font-bold uppercase tracking-wider text-brand-black">
                Cek Opsi & Tarif Pengiriman
              </p>
              <p className="text-xs text-neutral-500 font-sans mt-0.5">
                Klik tombol di sebelah untuk menghitung tarif kurir Biteship ke Kode Pos (<strong>{selectedAddress.postal_code}</strong>).
              </p>
            </div>
            <Button
              type="button"
              onClick={onCalculateShipping}
              variant="primary"
              className="text-xs uppercase tracking-wider font-semibold whitespace-nowrap shrink-0"
            >
              <Truck size={14} className="mr-1.5" /> Cek Ongkos Kirim
            </Button>
          </div>
        ) : shippingLoading ? (
          <div className="space-y-2">
            <div className="h-12 bg-neutral-100 animate-pulse rounded-none" />
            <div className="h-12 bg-neutral-100 animate-pulse rounded-none" />
          </div>
        ) : shippingError ? (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium space-y-2 rounded-none">
            <p className="font-semibold uppercase tracking-wider text-[11px] text-red-800">
              Gagal Memuat Tarif Pengiriman Biteship
            </p>
            <p className="text-red-600">{shippingError}</p>
            <Button
              type="button"
              onClick={onCalculateShipping}
              variant="outline"
              className="text-[11px] uppercase tracking-wider font-semibold mt-2"
            >
              Coba Hitung Ulang
            </Button>
          </div>
        ) : shippingOptions.length > 0 ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-neutral-500 font-sans">
                Opsi kurir untuk kode pos <strong>{selectedAddress.postal_code}</strong>:
              </span>
              <button
                type="button"
                onClick={onCalculateShipping}
                className="text-[11px] text-brand-black hover:text-brand-gold underline font-heading font-medium uppercase tracking-wider transition-colors"
              >
                Hitung Ulang
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {shippingOptions.map((option) => (
                <motion.div
                  whileHover={{
                    y: -2,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    borderColor: '#171717',
                  }}
                  whileTap={{ scale: 0.99 }}
                  key={option.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectCourier(option)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelectCourier(option)
                    }
                  }}
                  className={`p-4 border cursor-pointer transition-all duration-300 relative rounded-none ${
                    selectedCourier?.id === option.id
                      ? 'border-brand-gold bg-brand-gold-muted/10 ring-1 ring-brand-gold'
                      : 'border-neutral-200 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-heading font-medium text-xs text-brand-black uppercase tracking-wider">
                      {option.courier_name}
                    </span>
                    <span className="font-sans font-bold text-xs text-brand-black">
                      {formatIDR(option.price)}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-400">
                    Estimasi tiba: {option.etd_min} - {option.etd_max} Hari
                  </p>
                  {selectedCourier?.id === option.id && (
                    <div className="absolute top-2 right-2 bg-brand-gold text-white rounded-full p-0.5">
                      <Check size={8} />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-none">
            Tidak ada opsi pengiriman Biteship yang tersedia untuk kode pos (<strong>{selectedAddress.postal_code}</strong>). Harap periksa kembali alamat Anda atau hubungi Admin.
          </div>
        )}
      </div>

      {/* Note Section */}
      <div className="space-y-2 pt-4 border-t border-neutral-100">
        <Textarea
          label="Catatan Pesanan"
          id="order-notes"
          placeholder="Tulis instruksi khusus (cth: ukuran tambahan, warna cadangan, dll)..."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          maxLength={200}
          rows={3}
          helperText={`${notes.length}/200 karakter`}
        />
      </div>
    </div>
  )
}
