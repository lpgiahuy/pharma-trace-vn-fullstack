import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { blogService } from '@/services/analytics.service'
import { formatDate } from '@/utils'
import { InlineLoader } from '@/components/ui/Spinner'
import { Eye } from 'lucide-react'

export default function BlogListPage() {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { blogService.getAll().then(r => setBlogs(r.data)).finally(() => setLoading(false)) }, [])

  return (
    <div className="page-container py-10 animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="section-title mb-2">Health & Wellness Blog</h1>
        <p className="text-slate-500">Expert tips, medication guides, and healthy living advice</p>
      </div>
      {loading ? <InlineLoader /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map(blog => (
            <Link key={blog.id} to={`/blog/${blog.id}`} className="card overflow-hidden hover:shadow-elevated transition-shadow group">
              <div className="aspect-video bg-brand-50 overflow-hidden">
                <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-4">
                <span className="badge-blue text-xs mb-2 inline-block px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">{blog.category}</span>
                <h2 className="font-display font-semibold text-slate-900 line-clamp-2 mb-2 group-hover:text-brand-600 transition-colors">{blog.title}</h2>
                <p className="text-sm text-slate-500 line-clamp-2 mb-3">{blog.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{blog.author} · {formatDate(blog.publishedAt)}</span>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{blog.views?.toLocaleString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
