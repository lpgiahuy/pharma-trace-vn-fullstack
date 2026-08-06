import React from 'react'
import PropTypes from 'prop-types'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { cn } from '@/utils'

const QuickSubCategorySelect = ({ categories, category, setParam, t }) => {
  const activeParent = categories.find(c => c.id == category || c.children?.some(child => child.id == category));
  if (!activeParent || !activeParent.children?.length) return null;
 
  return (
    <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
          {t('product_list.subcategories_of', { name: activeParent.name, defaultValue: `Danh mục ${activeParent.name}` })}
        </h3>
        {category != activeParent.id && (
          <button 
            type="button"
            onClick={() => setParam('category', activeParent.id)}
            className="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline"
          >
            {t('common.view_all_in_parent', { defaultValue: 'Xem tất cả' })}
          </button>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
        {activeParent.children.map(child => (
          <button
            key={child.id}
            onClick={() => setParam('category', child.id)}
            className={cn(
              "flex flex-col items-center gap-2 min-w-[100px] p-4 rounded-2xl border transition-all shrink-0",
              category == child.id 
                ? "bg-brand-50 border-brand-200 shadow-sm shadow-brand-100" 
                : "bg-white border-slate-100 hover:border-brand-200 hover:shadow-md"
            )}
          >
            <CategoryIcon 
              name={child.iconName} 
              className={cn(
                "w-12 h-12 bg-transparent",
                category == child.id ? "scale-110" : ""
              )} 
              size={24} 
            />
            <span className={cn(
              "text-[11px] font-bold text-center leading-tight truncate w-full px-1",
              category == child.id ? "text-brand-700" : "text-slate-600"
            )}>{child.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

QuickSubCategorySelect.propTypes = {
  categories: PropTypes.array.isRequired,
  category: PropTypes.string,
  setParam: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired
}

export default QuickSubCategorySelect;
