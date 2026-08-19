import { create } from 'zustand'
import { productService } from '@/services/product.service'

const ICON_MAPPING = {
  // Household medicine cabinet
  'tủ thuốc': 'Pill',
  'cabinet': 'Pill',
  'medicine': 'Pill',
  'giảm đau': 'Thermometer',
  'pain relief': 'Thermometer',
  'hạ sốt': 'Thermometer',
  'fever': 'Thermometer',
  'kháng dị ứng': 'Wind',
  'allergy': 'Wind',
  'ho & cảm lạnh': 'Waves',
  'cough': 'Waves',
  'cold': 'Waves',
  'hệ hô hấp': 'Lungs',
  'respiratory': 'Lungs',
  'tiêu hóa': 'Apple',
  'digestive': 'Apple',
  'kháng viêm': 'ShieldCheck',
  'anti-inflammatory': 'ShieldCheck',
  'mắt/tai/mũi': 'Eye',
  'eye': 'Eye',
  'ear': 'Eye',
  'nose': 'Eye',
  'dầu, cao': 'Zap',
  'balm': 'Zap',
  'oil': 'Zap',

  // Prescription / specialty drugs
  'đặc trị': 'Stethoscope',
  'prescription': 'Stethoscope',
  'specialty': 'Stethoscope',
  'tim mạch': 'HeartPulse',
  'cardiovascular': 'HeartPulse',
  'heart': 'HeartPulse',
  'huyết áp': 'Activity',
  'blood pressure': 'Activity',
  'tiểu đường': 'Droplet',
  'diabetes': 'Droplet',
  'da liễu': 'Sparkles',
  'dermatology': 'Sparkles',
  'skincare': 'Sparkles',
  'cơ xương khớp': 'Bone',
  'bone': 'Bone',
  'joint': 'Bone',
  'thần kinh': 'Brain',
  'nervous': 'Brain',
  'ung thư': 'Radiation',
  'oncology': 'Radiation',
  'kháng sinh': 'Pill',
  'antibiotic': 'Pill',

  // Vitamins & functional foods
  'vitamin': 'Leaf',
  'supplement': 'Leaf',
  'thực phẩm chức năng': 'Milk',
  'functional food': 'Milk',
  'giảm cân': 'Scale',
  'weight loss': 'Scale',
  'thể thao': 'Dumbbell',
  'fitness': 'Dumbbell',
  'sports': 'Dumbbell',

  // Sexual health
  'nam': 'UserPlus',
  'men': 'UserPlus',
  'nữ': 'User',
  'women': 'User',
  'giới tính': 'Heart',
  'sexual health': 'Heart',
  'ngừa thai': 'ShieldAlert',
  'contraceptive': 'ShieldAlert',

  // Default keywords
  'y tế': 'PlusCircle',
  'medical': 'PlusCircle',
  'khác': 'Grid',
  'other': 'Grid'
};

const getIconForCategory = (name) => {
  if (!name) return 'Package';
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
  fetchCategories: async (force = false) => {
    if (!force && (get().fetched || get().loading)) return
    set({ loading: true })
    try {
      const data = await productService.getCategories()
      const mapCategory = (c, i) => ({
        id: c.id,
        name: c.ten_danh_muc || c.name,
        slug: c.slug || `cat-${c.id}`,
        iconName: c.hinh_anh_icon || getIconForCategory(c.ten_danh_muc || c.name),
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
