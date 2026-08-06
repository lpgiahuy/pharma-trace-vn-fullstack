import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { ChevronDown, ChevronUp, Check } from 'lucide-react'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { cn } from '@/utils'

const CategoryFilterItem = ({ cat, selectedCategory, onCategoryChange }) => {
  const hasChildren = cat.children && cat.children.length > 0;
  const isParentActive = selectedCategory == cat.id || cat.children?.some(child => selectedCategory == child.id);
  const [expanded, setExpanded] = useState(isParentActive);
  
  // Re-sync expansion when selection changes externally
  useEffect(() => {
    if (isParentActive) setExpanded(true);
  }, [isParentActive]);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 min-w-0">
        <button
          onClick={() => onCategoryChange(cat.id)}
          className={cn(
            "flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border text-[13px] font-medium transition-all group text-left min-w-0",
            selectedCategory == cat.id
              ? "bg-brand-50 border-brand-200 text-brand-700 shadow-sm" 
              : "bg-surface-soft/50 border-slate-100 text-slate-600 hover:border-brand-200 hover:bg-white"
          )}
        >
          <div className={cn(
            "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
            selectedCategory == cat.id ? "border-brand-500 bg-brand-500" : "border-slate-300 group-hover:border-brand-400"
          )}>
            {selectedCategory == cat.id ? (
              <Check className="w-3 h-3 text-white" />
            ) : (
              <CategoryIcon 
                name={cat.iconName} 
                className="w-5 h-5 bg-transparent" 
                iconClassName="text-slate-400 group-hover:text-brand-500" 
                size={14} 
              />
            )}
          </div>
          <span className="truncate">{cat.name}</span>
        </button>
        
        {hasChildren && (
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className={cn(
              "w-10 h-11 flex items-center justify-center rounded-xl border border-slate-100 text-slate-400 hover:bg-white hover:text-brand-500 transition-all",
              expanded && "bg-white text-brand-500 border-brand-100 shadow-sm"
            )}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Sub-categories */}
      {hasChildren && expanded && (
        <div className="pl-6 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
          {cat.children.map(child => {
            const isChildActive = selectedCategory == child.id
            return (
              <button
                key={child.id}
                onClick={() => onCategoryChange(child.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2 rounded-lg border text-[12px] font-medium transition-all group text-left min-w-0",
                  isChildActive 
                    ? "bg-brand-50 border-brand-100 text-brand-600 shadow-sm" 
                    : "bg-transparent border-transparent text-slate-500 hover:bg-brand-50/50 hover:text-brand-600"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded-sm border flex items-center justify-center transition-all shrink-0",
                  isChildActive ? "border-brand-500 bg-brand-500" : "border-slate-200 group-hover:border-brand-300"
                )}>
                  {isChildActive && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <span className="truncate">{child.name}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  );
};

CategoryFilterItem.propTypes = {
  cat: PropTypes.object.isRequired,
  selectedCategory: PropTypes.string,
  onCategoryChange: PropTypes.func.isRequired
}

export default CategoryFilterItem;
