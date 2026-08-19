/**
 * Data Formatters & Enum Mappers for PharmaTrace VN
 * Maps raw database ENUMs into localized, human-friendly display text and color tags.
 */

export const UNIT_TYPE_MAP = {
  NhaMay: { vi: 'Nhà máy sản xuất', en: 'Manufacturing Plant', color: 'blue' },
  NhaPhanPhoi: { vi: 'Kho / Nhà phân phối', en: 'Warehouse / Distributor', color: 'cyan' },
  NhaThuoc: { vi: 'Nhà thuốc / Cửa hàng', en: 'Pharmacy / Retail Store', color: 'green' }
}

export const ROLE_MAP = {
  SuperAdmin: { vi: 'Quản trị tối cao', en: 'Super Admin', color: 'purple' },
  superadmin: { vi: 'Quản trị tối cao', en: 'Super Admin', color: 'purple' },
  Admin: { vi: 'Quản trị viên', en: 'Admin', color: 'indigo' },
  admin: { vi: 'Quản trị viên', en: 'Admin', color: 'indigo' },
  QuanLyKho: { vi: 'Quản lý kho', en: 'Warehouse Manager', color: 'cyan' },
  NhanVienKho: { vi: 'Nhân viên kho', en: 'Warehouse Staff', color: 'geekblue' },
  QuanLyCuaHang: { vi: 'Quản lý cửa hàng', en: 'Store Manager', color: 'orange' },
  NhanVienBanHang: { vi: 'Nhân viên bán hàng', en: 'Sales Staff', color: 'blue' },
  NhaMay: { vi: 'Nhân viên nhà máy', en: 'Factory Staff', color: 'blue' },
  Customer: { vi: 'Khách hàng', en: 'Customer', color: 'green' },
  customer: { vi: 'Khách hàng', en: 'Customer', color: 'green' }
}

export const PO_STATUS_MAP = {
  ChoDuyet: { vi: 'Chờ duyệt', en: 'Pending Approval', color: 'gold' },
  DaDuyet: { vi: 'Đã duyệt', en: 'Approved', color: 'blue' },
  DaNhapKho: { vi: 'Đã nhập kho 100%', en: 'Fully Received', color: 'green' },
  DaHuy: { vi: 'Đã hủy', en: 'Cancelled', color: 'red' }
}

export const ITEM_STATUS_MAP = {
  TrongKho: { vi: 'Trong kho', en: 'In Stock', color: 'green' },
  DangLuanChuyen: { vi: 'Đang luân chuyển', en: 'In Transit', color: 'processing' },
  DaXuat: { vi: 'Đã xuất kho', en: 'Dispatched', color: 'orange' },
  DaBan: { vi: 'Đã bán', en: 'Sold', color: 'blue' },
  DaHuy: { vi: 'Đã tiêu hủy', en: 'Disposed', color: 'red' },
  ThuHoi: { vi: 'Đã thu hồi', en: 'Recalled', color: 'volcano' }
}

export const formatUnitType = (type, lang = 'en') => {
  if (!type) return '—'
  const found = UNIT_TYPE_MAP[type]
  return found ? (found[lang] || found.en) : type
}

export const getUnitTypeMeta = (type, lang = 'en') => {
  const found = UNIT_TYPE_MAP[type]
  if (!found) return { label: type, vi: type, en: type, color: 'default' }
  return { ...found, label: found[lang] || found.en }
}

export const formatRole = (role, lang = 'en') => {
  if (!role) return '—'
  const found = ROLE_MAP[role]
  return found ? (found[lang] || found.en) : role
}

export const getRoleMeta = (role, lang = 'en') => {
  const found = ROLE_MAP[role]
  if (!found) return { label: role, vi: role, en: role, color: 'default' }
  return { ...found, label: found[lang] || found.en }
}

export const formatPoStatus = (status, lang = 'en') => {
  if (!status) return '—'
  const found = PO_STATUS_MAP[status]
  return found ? (found[lang] || found.en) : status
}

export const getPoStatusMeta = (status, lang = 'en') => {
  const found = PO_STATUS_MAP[status]
  if (!found) return { label: status, vi: status, en: status, color: 'default' }
  return { ...found, label: found[lang] || found.en }
}

export const formatItemStatus = (status, lang = 'en') => {
  if (!status) return '—'
  const found = ITEM_STATUS_MAP[status]
  return found ? (found[lang] || found.en) : status
}

export const getItemStatusMeta = (status, lang = 'en') => {
  const found = ITEM_STATUS_MAP[status]
  if (!found) return { label: status, vi: status, en: status, color: 'default' }
  return { ...found, label: found[lang] || found.en }
}
