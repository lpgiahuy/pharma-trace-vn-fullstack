import { create } from 'zustand'
import { productService } from '@/services/product.service'

const ICON_MAPPING = {
  // Household medicine cabinet
  'tủ thuốc': 'Pill',
  'giảm đau': 'Thermometer',
  'hạ sốt': 'Thermometer',
  'kháng dị ứng': 'Wind',
  'ho & cảm lạnh': 'Waves',
  'hệ hô hấp': 'Lungs',
  'tiêu hóa': 'Apple',
  'kháng viêm': 'ShieldCheck',
  'mắt/tai/mũi': 'Eye',
  'dầu, cao': 'Zap',

  // Prescription / specialty drugs
  'đặc trị': 'Stethoscope',
  'tim mạch': 'HeartPulse',
  'huyết áp': 'Activity',
  'tiểu đường': 'Droplet',
  'da liễu': 'Sparkles',
  'cơ xương khớp': 'Bone',
  'thần kinh': 'Brain',
  'ung thư': 'Radiation',
  'kháng sinh': 'Bacteriophage',

  // Vitamins & functional foods
  'vitamin': 'Leaf',
  'thực phẩm chức năng': 'Milk',
  'giảm cân': 'Scale',

  // Sexual health
  'nam': 'UserPlus',
  'nữ': 'User',
  'giới tính': 'Heart',
  'ngừa thai': 'ShieldAlert',

  // Default keywords
  'y tế': 'PlusCircle',
  'khác': 'Grid'
};

const getIconForCategory = (name) => {
  const lowerName = name.toLowerCase();
  for (const [keyword, icon] of Object.entries(ICON_MAPPING)) {
    if (lowerName.includes(keyword)) return icon;
  }
  return 'Package'; // Default
};

export const useCategoryStore = create((set, get) => ({
  categories: [],
  loading: false,
  fetched: false,
  fetchCategories: async () => {
    if (get().fetched || get().loading) return
    set({ loading: true })
    try {
      const data = await productService.getCategories()
      const mapCategory = (c, i) => ({
        id: c.id,
        name: c.ten_danh_muc || c.name,
        slug: c.slug || `cat-${c.id}`,
        iconName: getIconForCategory(c.ten_danh_muc || c.name),
        parentId: c.danh_muc_cha_id,
        children: c.children ? c.children.map((child, j) => mapCategory(child, j)) : []
      })

      const mapped = data.map((c, i) => mapCategory(c, i))
      set({ categories: mapped, fetched: true })
    } catch (e) {
      console.error('[categoryStore]', e)
    } finally {
      set({ loading: false })
    }
  }
}))
