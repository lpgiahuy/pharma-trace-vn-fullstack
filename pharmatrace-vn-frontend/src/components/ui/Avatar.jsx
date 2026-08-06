import PropTypes from 'prop-types'
import { cn, getInitials } from '@/utils'

const sizes = { 
  xs: 'w-6 h-6 text-[10px]', 
  sm: 'w-8 h-8 text-xs', 
  md: 'w-10 h-10 text-sm', 
  lg: 'w-12 h-12 text-base', 
  xl: 'w-16 h-16 text-xl' 
}

const colors = [
  'bg-brand-100 text-brand-700', 
  'bg-green-100 text-green-700', 
  'bg-purple-100 text-purple-700', 
  'bg-orange-100 text-orange-700', 
  'bg-pink-100 text-pink-700'
]

export const Avatar = ({ src, name, size = 'md', className }) => {
  const initials = getInitials(name)
  const colorIdx = name ? name.charCodeAt(0) % colors.length : 0

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={cn('rounded-full object-cover shrink-0 border border-slate-100', sizes[size], className)}
        loading="lazy"
      />
    )
  }

  return (
    <div 
      role="img" 
      aria-label={name ? `Avatar for ${name}` : 'Avatar'}
      className={cn('rounded-full flex items-center justify-center font-semibold shrink-0 uppercase', sizes[size], colors[colorIdx], className)}
    >
      {initials || '?'}
    </div>
  )
}

Avatar.propTypes = {
  src: PropTypes.string,
  name: PropTypes.string,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  className: PropTypes.string,
}
