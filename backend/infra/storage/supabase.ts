// ============================================================
// SUPABASE STORAGE CLIENT
// Centralized file storage via Supabase Storage (S3-compatible)
// ============================================================

import { createClient } from '@supabase/supabase-js'
import { extname } from 'path'
import { randomBytes } from 'crypto'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY
const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'product-images'

if (!supabaseUrl || !supabaseKey) {
  console.warn('[STORAGE] SUPABASE_URL or SUPABASE_SERVICE_KEY not set — file uploads will fail')
}

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

/**
 * Upload file buffer ke Supabase Storage
 * Returns: public URL dari file yang diupload
 */
export async function uploadFileToStorage(
  buffer: Buffer,
  originalname: string,
  mimetype: string,
  productId: number
): Promise<string> {
  if (!supabase) {
    throw new Error('[STORAGE] Supabase client not initialized. Check SUPABASE_URL and SUPABASE_SERVICE_KEY.')
  }

  const ext = extname(originalname)
  const filename = `${Date.now()}-${randomBytes(4).toString('hex')}${ext}`
  const storagePath = `products/${productId}/${filename}`

  const { error } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, buffer, {
      contentType: mimetype,
      upsert: false,
    })

  if (error) {
    throw new Error(`[STORAGE] Upload failed: ${error.message}`)
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(storagePath)

  return urlData.publicUrl
}

/**
 * Delete file dari Supabase Storage
 * path: the storagePath used during upload (e.g., products/1/123-abc.jpg)
 */
export async function deleteFileFromStorage(storagePath: string): Promise<void> {
  if (!supabase) {
    console.error('[STORAGE] Supabase client not initialized — cannot delete file')
    return
  }

  // Strip bucket prefix jika ada
  const normalizedPath = storagePath.startsWith('products/')
    ? storagePath
    : storagePath.replace(/^.*?(products\/)/, 'products/')

  const { error } = await supabase.storage
    .from(bucketName)
    .remove([normalizedPath])

  if (error) {
    // Non-fatal: log tapi jangan throw (file mungkin sudah tidak ada)
    console.error(`[STORAGE] Delete failed for ${normalizedPath}: ${error.message}`)
  }
}

/**
 * Ekstrak storagePath dari public URL Supabase
 * Digunakan saat delete (dari URL ke path relatif)
 */
export function extractStoragePath(publicUrl: string): string {
  // URL format: https://xxx.supabase.co/storage/v1/object/public/<bucket>/<path>
  const marker = `/${bucketName}/`
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return publicUrl
  return publicUrl.slice(idx + marker.length)
}
