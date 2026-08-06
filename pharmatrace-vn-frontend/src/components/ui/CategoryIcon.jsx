import React from 'react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/utils';

/**
 * CategoryIcon - Renders a professional Lucide icon for a given category.
 * @param {string} name - The Lucide icon component name (e.g., 'Pill', 'Leaf')
 * @param {string} className - Optional tailwind classes for the container
 * @param {string} iconClassName - Optional tailwind classes for the icon itself
 * @param {number} size - Icon size in pixels
 */
export const CategoryIcon = ({ 
    name, 
    className, 
    iconClassName,
    size = 24,
    ...props 
}) => {
    // Fallback if icon name is missing or invalid
    const IconComponent = LucideIcons[name] || LucideIcons.Package;

    return (
        <div 
            className={cn(
                "relative flex items-center justify-center rounded-2xl transition-all duration-300",
                "bg-brand-50/50 group-hover:bg-brand-100/80 group-hover:scale-110",
                className
            )}
            {...props}
        >
            <IconComponent 
                size={size} 
                className={cn(
                    "text-brand-600 transition-colors group-hover:text-brand-700",
                    iconClassName
                )} 
                strokeWidth={1.8}
            />
        </div>
    );
};
