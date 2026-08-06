import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { blogService } from '@/services/analytics.service'
import { PageLoader } from '@/components/ui/Spinner'
import { formatDate } from '@/utils'
import { ChevronLeft } from 'lucide-react'
import { sanitizeHtml } from '@/utils/security'
import toast from 'react-hot-toast'

export default function BlogDetailPage() {
  const { slug } = useParams()
  const [blog, setBlog] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { 
    if (!slug) return
    blogService.getBySlug(slug)
      .then(setBlog)
      .catch(err => {
        console.error('[BlogDetail] Error:', err)
        toast.error('Failed to load article')
      })
      .finally(() => setLoading(false)) 
  }, [slug])

  if (loading) return <PageLoader />
  if (!blog) return (
    <div className="page-container py-16 text-center">
      <h2 className="text-xl font-bold text-slate-800">Article Not Found</h2>
      <p className="text-slate-500 mb-6">The article you are looking for might have been moved or deleted.</p>
      <Link to="/blog" className="btn-primary">Back to Blog</Link>
    </div>
  )

  return (
    <article className="page-container py-10 max-w-3xl animate-fade-in">
      <Link to="/blog" className="flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 mb-6"><ChevronLeft className="w-4 h-4" /> Back to Blog</Link>
      <span className="badge-blue text-xs mb-3 inline-block px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">{blog.category}</span>
      <h1 className="text-3xl font-display font-bold text-slate-900 mb-4">{blog.title}</h1>
      <div className="flex items-center gap-3 text-sm text-slate-500 mb-6">
        <span>By <strong className="text-slate-700">{blog.author || 'Admin'}</strong></span>
        <span>·</span>
        <span>{formatDate(blog.publishedAt || blog.date)}</span>
      </div>
      {blog.coverImage && <img src={blog.coverImage} alt={blog.title} className="w-full rounded-2xl mb-8 aspect-video object-cover shadow-lg border border-surface-border" />}
      <div 
        className="prose prose-slate max-w-none text-slate-700 leading-relaxed ql-editor px-0" 
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(blog.content) }} 
      />
    </article>
  )
}
