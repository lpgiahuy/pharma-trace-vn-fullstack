export const ROLES = {
  CUSTOMER:  'customer',
  ADMIN:     'admin',
  MANAGER:   'manager',
  WAREHOUSE: 'warehouse',
  PHARMACIST:'pharmacist',
  STAFF:     'staff',
}

export const ORDER_STATUS = {
  ChoXacNhan: 'ChoXacNhan',
  DaDongGoi:   'DaDongGoi',
  DangGiao:   'DangGiao',
  HoanThanh:  'HoanThanh',
  DaHuy:      'DaHuy',
  TraHang:    'TraHang',
}

export const ORDER_STATUS_LABELS = {
  ChoXacNhan: 'Chờ xác nhận',
  DaDongGoi:   'Đã đóng gói',
  DangGiao:   'Đang giao',
  HoanThanh:  'Hoàn thành',
  DaHuy:      'Đã hủy',
  TraHang:    'Trả hàng',
}

export const ORDER_STATUS_COLORS = {
  ChoXacNhan: 'orange',
  DaDongGoi:   'purple',
  DangGiao:   'blue',
  HoanThanh:  'green',
  DaHuy:      'red',
  TraHang:    'gray',
}

export const PAYMENT_METHODS = {
  COD:      'cod',
  VNPAY:    'vnpay',
  MOMO:     'momo',
  BANKING:  'banking',
  CARD:     'card',
}

export const PRODUCT_CATEGORIES = [
  { id: 1, name: 'Vitamins & Supplements', slug: 'vitamins-supplements', icon: '💊' },
  { id: 2, name: 'Cold & Flu',             slug: 'cold-flu',             icon: '🤧' },
  { id: 3, name: 'Pain Relief',            slug: 'pain-relief',          icon: '💉' },
  { id: 4, name: 'Digestive Health',       slug: 'digestive-health',     icon: '🫁' },
  { id: 5, name: 'Skincare',               slug: 'skincare',             icon: '🧴' },
  { id: 6, name: 'Baby & Children',        slug: 'baby-children',        icon: '👶' },
  { id: 7, name: 'Medical Devices',        slug: 'medical-devices',      icon: '🩺' },
  { id: 8, name: 'Prescription',           slug: 'prescription',         icon: '📋' },
]

export const VOUCHER_TYPES = {
  PERCENT:   'percent',
  FIXED:     'fixed',
  FREESHIP:  'freeship',
}

export const STORAGE_KEYS = {
  ACCESS_TOKEN:  'pharma_access_token',
  REFRESH_TOKEN: 'pharma_refresh_token',
  USER:          'pharma_user',
  CART:          'pharma_cart',
  WISHLIST:      'pharma_wishlist',
}

export const PAGINATION = {
  DEFAULT_PAGE:     1,
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
}

export const SORT_OPTIONS = [
  { value: 'newest',        label: 'Newest First' },
  { value: 'oldest',        label: 'Oldest First' },
  { value: 'price_asc',     label: 'Price: Low to High' },
  { value: 'price_desc',    label: 'Price: High to Low' },
  { value: 'name_asc',      label: 'Name A-Z' },
  { value: 'best_selling',  label: 'Best Selling' },
  { value: 'top_rated',     label: 'Top Rated' },
]

export const RMA_REASONS = [
  'Wrong product received',
  'Damaged / defective product',
  'Product expired',
  'Missing items',
  'Changed my mind',
  'Other',
]
