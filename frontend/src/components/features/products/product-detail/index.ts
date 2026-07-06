// Product Detail Components
export { ProductGallery } from './product-gallery';
export { ProductInfo } from './product-info';
export { VariantSelector } from './variant-selector';
export { QuantitySelector } from './quantity-selector';
export { AddToCartButton } from './add-to-cart';
export { ProductTabs } from './product-tabs';
export { ProductSpecifications } from './product-specifications';
export { ReviewsPlaceholder } from './reviews-placeholder';
export { RelatedProducts } from './related-products';
export { ProductBreadcrumb } from './product-breadcrumb';
export { ShippingInfo } from './shipping-info';

// API
export { fetchProductDetail, fetchRelatedProducts } from './product-detail.server';

// Types - aliased to avoid naming conflicts
export type {
  Product,
  ProductImage,
  ProductVariant,
  ProductListItem,
  ProductDetailResponse,
  ShippingInfo as ShippingInfoData,
  TabType,
} from './product-detail.types';
