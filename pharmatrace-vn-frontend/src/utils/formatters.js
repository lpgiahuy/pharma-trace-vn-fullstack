/**
 * Data Formatters & Enum Mappers for PharmaTrace VN
 * Maps raw database ENUMs into localized, human-friendly display text and color tags.
 */

export const UNIT_TYPE_MAP = {
  NhaMay: { vi: 'English', en: 'Manufacturing Plant', color: 'blue' },
  NhaPhanPhoi: { vi: 'English', en: 'Warehouse / Distributor', color: 'cyan' },
  NhaThuoc: { vi: 'English', en: 'Pharmacy / Retail Store', color: 'green' }
}

export const ROLE_MAP = {
  SuperAdmin: { vi: 'English', en: 'Super Admin', color: 'purple' },
  superadmin: { vi: 'English', en: 'Super Admin', color: 'purple' },
  Admin: { vi: 'English', en: 'Admin', color: 'indigo' },
  admin: { vi: 'English', en: 'Admin', color: 'indigo' },
  QuanLyKho: { vi: 'English', en: 'Warehouse Manager', color: 'cyan' },
  NhanVienKho: { vi: 'English', en: 'Warehouse Staff', color: 'geekblue' },
  QuanLyCuaHang: { vi: 'English', en: 'Store Manager', color: 'orange' },
  NhanVienBanHang: { vi: 'English', en: 'Sales Staff', color: 'blue' },
  NhaMay: { vi: 'English', en: 'Factory Staff', color: 'blue' },
  Customer: { vi: 'English', en: 'Customer', color: 'green' },
  customer: { vi: 'English', en: 'Customer', color: 'green' }
}

export const PO_STATUS_MAP = {
  ChoDuyet: { vi: 'English', en: 'Pending Approval', color: 'gold' },
  DaDuyet: { vi: 'English', en: 'Approved', color: 'blue' },
  DaNhapKho: { vi: 'English', en: 'Fully Received', color: 'green' },
  DaHuy: { vi: 'English', en: 'Cancelled', color: 'red' }
}

export const ITEM_STATUS_MAP = {
  TrongKho: { vi: 'English', en: 'In Stock', color: 'green' },
  DangLuanChuyen: { vi: 'English', en: 'In Transit', color: 'processing' },
  DaXuat: { vi: 'English', en: 'Dispatched', color: 'orange' },
  DaBan: { vi: 'English', en: 'Sold', color: 'blue' },
  DaHuy: { vi: 'English', en: 'Disposed', color: 'red' },
  ThuHoi: { vi: 'English', en: 'Recalled', color: 'volcano' }
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
