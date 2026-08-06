import PropTypes from 'prop-types'
import { PackageX, ServerCrash, SearchX, ShoppingBag } from 'lucide-react'
import { Button } from './Button'

export const EmptyState = ({ icon: Icon = PackageX, title = 'Nothing here yet', description, action, actionLabel = 'Go Back' }) => (
  <div 
    role="status"
    className="flex flex-col items-center justify-center py-16 text-center"
  >
    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-slate-400" aria-hidden="true" />
    </div>
    <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
    {description && <p className="text-sm text-slate-500 max-w-xs leading-relaxed">{description}</p>}
    {action && (
      <Button variant="secondary" size="sm" className="mt-4" onClick={action}>
        {actionLabel}
      </Button>
    )}
  </div>
)

EmptyState.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.node,
  description: PropTypes.node,
  action: PropTypes.func,
  actionLabel: PropTypes.string,
}

export const ErrorState = ({ error, retry }) => (
  <div 
    role="alert"
    className="flex flex-col items-center justify-center py-16 text-center"
  >
    <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
      <ServerCrash className="w-8 h-8 text-red-400" aria-hidden="true" />
    </div>
    <h3 className="text-base font-semibold text-red-700 mb-1">Something went wrong</h3>
    <p className="text-sm text-slate-500 max-w-xs mb-4">{error?.message || 'An unexpected error occurred.'}</p>
    {retry && <Button variant="danger" size="sm" onClick={retry}>Try Again</Button>}
  </div>
)

ErrorState.propTypes = {
  error: PropTypes.shape({
    message: PropTypes.string,
  }),
  retry: PropTypes.func,
}

export const SearchEmpty = ({ query }) => (
  <EmptyState
    icon={SearchX}
    title="No results found"
    description={query ? `No items match "${query}". Try a different search.` : 'Try adjusting your filters.'}
  />
)

SearchEmpty.propTypes = {
  query: PropTypes.string,
}

export const CartEmpty = ({ onShop }) => (
  <EmptyState
    icon={ShoppingBag}
    title="Your cart is empty"
    description="Add some products to get started."
    action={onShop}
    actionLabel="Start Shopping"
  />
)

CartEmpty.propTypes = {
  onShop: PropTypes.func,
}
