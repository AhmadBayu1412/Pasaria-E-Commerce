/**
 * Product Detail API - Server Side
 * 
 * Server-side data fetching for product detail page.
 */

import type { Product, ProductDetailResponse, ProductListItem, Category } from './product-detail.types';

// Mock categories
const mockCategories: Category[] = [
  { id: '1', name: 'Elektronik', slug: 'elektronik', productCount: 150 },
  { id: '2', name: 'Fashion', slug: 'fashion', productCount: 280 },
  { id: '3', name: 'Kecantikan', slug: 'kecantikan', productCount: 95 },
  { id: '4', name: 'Rumah Tangga', slug: 'rumah-tangga', productCount: 120 },
  { id: '5', name: 'Olahraga', slug: 'olahraga', productCount: 75 },
];

// Mock product detail data
const mockProductDetail: Product = {
  id: 1,
  name: 'Laptop ASUS ROG Strix G16',
  slug: 'laptop-asus-rog-strix-g16',
  sku: 'ASUS-ROG-G16-001',
  description: `Laptop gaming dengan performa tinggi untuk para gamers sejati. Dilengkapi dengan processor Intel Core i9 Generasi ke-14 dan GPU NVIDIA GeForce RTX 4070 untuk pengalaman gaming yang mulus dan imersif.

Fitur utama:
- Layar 16 inci WUXGA 165Hz dengan color accuracy tinggi
- Prosesor Intel Core i9-14900HX
- GPU NVIDIA GeForce RTX 4070 8GB GDDR6
- RAM 32GB DDR5
- Storage 1TB PCIe Gen4 SSD
- Sistem pendingin ROG Intelligent Cooling
- Keyboard RGB per-key dengan anti-ghosting
- Baterai 90Wh dengan fast charging

Laptop ini dirancang untuk gaming kompetitif dan content creation dengan thermal performance yang optimal.`,
  price: 24999000,
  originalPrice: 27999000,
  images: [
    { id: 1, url: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800', alt: 'ASUS ROG Strix G16 - Front View', isPrimary: true },
    { id: 2, url: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800', alt: 'ASUS ROG Strix G16 - Keyboard', isPrimary: false },
    { id: 3, url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800', alt: 'ASUS ROG Strix G16 - Side View', isPrimary: false },
    { id: 4, url: 'https://images.unsplash.com/photo-1615751072497-5f5169febe17?w=800', alt: 'ASUS ROG Strix G16 - Screen', isPrimary: false },
  ],
  category: mockCategories[0],
  rating: 4.5,
  reviewCount: 128,
  badges: ['sale', 'hot'],
  variants: [
    {
      id: 1,
      sku: 'ASUS-ROG-G16-BLK-16-512',
      attributes: { color: 'Stealth Black', colorHex: '#1a1a1a', size: '16GB/512GB' },
      price: 22999000,
      stock: 10,
      isAvailable: true,
    },
    {
      id: 2,
      sku: 'ASUS-ROG-G16-BLK-16-1TB',
      attributes: { color: 'Stealth Black', colorHex: '#1a1a1a', size: '16GB/1TB' },
      price: 24999000,
      stock: 15,
      isAvailable: true,
    },
    {
      id: 3,
      sku: 'ASUS-ROG-G16-BLK-32-1TB',
      attributes: { color: 'Stealth Black', colorHex: '#1a1a1a', size: '32GB/1TB' },
      price: 27999000,
      stock: 8,
      isAvailable: true,
    },
    {
      id: 4,
      sku: 'ASUS-ROG-G16-ECM-16-1TB',
      attributes: { color: 'Eclipse Gray', colorHex: '#4a4a4a', size: '16GB/1TB' },
      price: 24999000,
      stock: 12,
      isAvailable: true,
    },
    {
      id: 5,
      sku: 'ASUS-ROG-G16-ECM-32-1TB',
      attributes: { color: 'Eclipse Gray', colorHex: '#4a4a4a', size: '32GB/1TB' },
      price: 27999000,
      stock: 5,
      isAvailable: true,
    },
    {
      id: 6,
      sku: 'ASUS-ROG-G16-GRN-16-1TB',
      attributes: { color: 'Electro Punk Green', colorHex: '#00ff88', size: '16GB/1TB' },
      price: 25499000,
      stock: 0,
      isAvailable: false,
    },
  ],
  totalStock: 50,
  isAvailable: true,
  specifications: {
    'Processor': 'Intel Core i9-14900HX',
    'GPU': 'NVIDIA GeForce RTX 4070 8GB',
    'RAM': 'Up to 32GB DDR5',
    'Storage': '512GB - 1TB PCIe Gen4 SSD',
    'Display': '16" WUXGA 165Hz',
    'Battery': '90Wh',
    'Weight': '2.5 kg',
    'OS': 'Windows 11 Home',
    'Warranty': '2 Tahun',
  },
  shipping: {
    weight: 3.5,
    dimensions: { length: 45, width: 30, height: 8 },
    shippingClass: 'Electronics - Fragile',
    estimatedDays: '2-4 hari kerja',
    freeShipping: true,
  },
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-03-01T15:30:00Z',
};

// Mock related products
const mockRelatedProducts: ProductListItem[] = [
  {
    id: 2,
    name: 'Laptop ASUS TUF Gaming F15',
    slug: 'asus-tuf-gaming-f15',
    price: 15990000,
    primaryImage: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400',
    badges: ['new'],
    isAvailable: true,
  },
  {
    id: 3,
    name: 'Laptop MSI Katana 15',
    slug: 'msi-katana-15',
    price: 18990000,
    originalPrice: 20990000,
    primaryImage: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=400',
    badges: ['sale'],
    isAvailable: true,
  },
  {
    id: 4,
    name: 'Laptop Lenovo Legion 5 Pro',
    slug: 'lenovo-legion-5-pro',
    price: 22990000,
    primaryImage: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400',
    isAvailable: true,
  },
  {
    id: 5,
    name: 'Laptop Acer Predator Helios 300',
    slug: 'acer-predator-helios-300',
    price: 21990000,
    originalPrice: 24990000,
    primaryImage: 'https://images.unsplash.com/photo-1615751072497-5f5169febe17?w=400',
    badges: ['sale', 'hot'],
    isAvailable: true,
  },
];

/**
 * Fetch product detail by slug
 */
export async function fetchProductDetail(slug: string): Promise<ProductDetailResponse | null> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // In real implementation, this would call the backend API
  // For now, return mock data if slug matches
  if (slug === mockProductDetail.slug) {
    return {
      product: mockProductDetail,
      relatedProducts: mockRelatedProducts,
    };
  }

  // Return null if product not found
  return null;
}

/**
 * Fetch related products by category
 */
export async function fetchRelatedProducts(categorySlug: string, excludeId?: number): Promise<ProductListItem[]> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Filter out current product and return mock data
  return mockRelatedProducts.filter((p) => p.id !== excludeId).slice(0, 4);
}
