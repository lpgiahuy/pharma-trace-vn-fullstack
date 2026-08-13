import React from 'react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/utils';

// Map Material Symbols icon names (from Admin panel) to Lucide vector icons
const MATERIAL_TO_LUCIDE_MAP = {
    medication: 'Pill',
    pill: 'Pill',
    vaccines: 'Syringe',
    medical_services: 'Stethoscope',
    health_and_safety: 'ShieldCheck',
    sanitizer: 'Sparkles',
    clean_hands: 'Sparkles',
    healing: 'Bandage',
    ecg_heart: 'Activity',
    psychology: 'Brain',
    eye: 'Eye',
    dentistry: 'Smile',
    child_care: 'Baby',
    nutrition: 'Apple',
    fitness_center: 'Dumbbell',
    skincare: 'Sparkles',
    category: 'Package',
    // Common aliases & fallbacks
    sports: 'Dumbbell',
    fitness: 'Dumbbell',
    heart: 'Heart',
    leaf: 'Leaf',
};

/**
 * CategoryIcon - Renders a professional Lucide icon or Material Symbols icon for a given category.
 * @param {string} name - Icon name (Lucide name or Material Symbols name)
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
    // 1. Check if name matches a Lucide Icon directly (e.g., 'Pill', 'Dumbbell', 'Stethoscope')
    let IconComponent = name ? LucideIcons[name] : null;

    // 2. Check if name is a Material Symbols name (e.g., 'fitness_center', 'medication')
    if (!IconComponent && name && MATERIAL_TO_LUCIDE_MAP[name.toLowerCase()]) {
        const mappedName = MATERIAL_TO_LUCIDE_MAP[name.toLowerCase()];
        IconComponent = LucideIcons[mappedName];
    }

    return (
        <div 
            className={cn(
                "relative flex items-center justify-center rounded-2xl transition-all duration-300 overflow-hidden p-1 select-none",
                "bg-brand-50/50 group-hover:bg-brand-100/80 group-hover:scale-110",
                className
            )}
            {...props}
        >
            {IconComponent ? (
                <IconComponent 
                    size={size} 
                    className={cn(
                        "text-brand-600 transition-colors group-hover:text-brand-700 flex-shrink-0",
                        iconClassName
                    )} 
                    strokeWidth={1.8}
                />
            ) : (
                <span 
                    className={cn(
                        "text-[9px] font-extrabold text-brand-700 tracking-tighter uppercase text-center leading-tight line-clamp-2 w-full break-all px-0.5",
                        iconClassName
                    )}
                >
                    {name || 'ICON'}
                </span>
            )}
        </div>
    );
};
