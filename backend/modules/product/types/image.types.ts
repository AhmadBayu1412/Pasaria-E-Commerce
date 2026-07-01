// (Optional - for internal service use)

export interface ProductImage {
  readonly id: number
  readonly productId: number
  readonly path: string
  readonly filename: string
  readonly mimeType: string
  readonly size: number
  readonly position: number
  readonly isPrimary: boolean
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface UploadImageOptions {
  readonly isPrimary?: boolean
}