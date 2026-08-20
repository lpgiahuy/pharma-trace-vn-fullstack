import React from 'react'
import PropTypes from 'prop-types'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { cn } from '@/utils'

const QuickSubCategorySelect = ({ categories, category, setParam, handleCategoryToggle, t }) => {
  const selectedIds = category ? category.split(',').filter(Boolean) : [];

  // Find active parent category
  const activeParent = categories.find(c => 
    selectedIds.includes(String(c.id)) || 
    c.children?.some(child => selectedIds.includes(String(child.id)))
  );

  if (!activeParent || !activeParent.children?.length) return null;

  const isAllParentSelected = selectedIds.length === 1 && selectedIds[0] == activeParent.id;

  return (
    <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
          {t('product_list.subcategories_of', { name: activeParent.name, defaultValue: `Danh mục ${activeParent.name}` })}
        </h3>
        {!isAllParentSelected && (
          <button 
            type="button"
            onClick={() => setParam('category', activeParent.id)}
            className="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline cursor-pointer"
          >
            {t('common.view_all_in_parent', { defaultValue: 'Xem tất cả' })}
          </button>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
        {activeParent.children.map(child => {
          const isSelected = selectedIds.includes(String(child.id));
          return (
            <button
              key={child.id}
              onClick={() => handleCategoryToggle(child.id, activeParent.id)}
              className={cn(
                "flex flex-col items-center gap-2 min-w-[95px] max-w-[115px] p-3 rounded-2xl border transition-all shrink-0 cursor-pointer select-none",
                isSelected 
                  ? "bg-brand-50 border-brand-300 shadow-sm shadow-brand-100 ring-2 ring-brand-500/20" 
                  : "bg-white border-slate-100 hover:border-brand-200 hover:shadow-md"
              )}
            >
              <CategoryIcon 
                name={child.iconName} 
                className={cn(
                  "w-10 h-10 bg-transparent flex-shrink-0",
                  isSelected ? "scale-110" : ""
                )} 
                size={22} 
              />
              <span className={cn(
                "text-[10px] sm:text-[11px] font-bold text-center leading-tight line-clamp-2 w-full px-0.5 break-words",
                isSelected ? "text-brand-700 font-extrabold" : "text-slate-600"
              )}>
                {child.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

QuickSubCategorySelect.propTypes = {
  categories: PropTypes.array.isRequired,
  category: PropTypes.string,
  setParam: PropTypes.func.isRequired,
  handleCategoryToggle: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired
}

export default QuickSubCategorySelect;
