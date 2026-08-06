import { Link } from 'react-router-dom'
import { ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'

export default function UnauthorizedPage() {
  const { isAuthenticated } = useAuthStore()
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="text-center px-4 animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-2xl font-display font-bold text-slate-900 mb-2">Access Denied</h1>
        <p className="text-slate-500 mb-8 max-w-sm mx-auto">
          You don't have permission to view this page. Contact your administrator if you believe this is an error.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/"><Button>Back to Home</Button></Link>
          {!isAuthenticated && <Link to="/login"><Button variant="secondary">Sign In</Button></Link>}
        </div>
      </div>
    </div>
  )
}
