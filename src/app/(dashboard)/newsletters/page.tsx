'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/auth-context'
import { newslettersApi } from '@/lib/api-client'
import {
  Megaphone,
  Plus,
  Send,
  Trash2,
  Eye,
  Loader2,
  Users,
  Building2,
  Wrench,
  CheckCircle,
  X,
  Calendar,
  Clock
} from 'lucide-react'

export default function NewslettersPage() {
  const { user, role } = useAuth()
  const isSuperAdminOrAdmin = role === 'super_admin' || role === 'admin'

  const [newsletters, setNewsletters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCompose, setShowCompose] = useState(false)
  const [sending, setSending] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Viewing detail modal
  const [viewingNewsletter, setViewingNewsletter] = useState<any>(null)

  // Form state
  const [form, setForm] = useState({
    title: '',
    targetRole: 'all', // 'all' | 'landlord' | 'agent'
    content: '',
  })

  const fetchNewsletters = async () => {
    setLoading(true)
    try {
      const res = await newslettersApi.list()
      setNewsletters(res.newsletters || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNewsletters()
  }, [])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) return

    setSending(true)
    setStatusMsg(null)
    try {
      const res: any = await newslettersApi.create(form)
      setStatusMsg({ type: 'success', text: res?.message || 'Newsletter broadcasted successfully!' })
      setForm({ title: '', targetRole: 'all', content: '' })
      setShowCompose(false)
      await fetchNewsletters()
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to send newsletter.' })
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this newsletter?')) return
    try {
      await newslettersApi.delete(id)
      await fetchNewsletters()
    } catch (err) {
      console.error(err)
    }
  }

  const getTargetBadge = (target: string) => {
    switch (target) {
      case 'landlord':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Building2 className="w-3.5 h-3.5" /> Landlords Only
          </span>
        )
      case 'agent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Wrench className="w-3.5 h-3.5" /> Agents Only
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Users className="w-3.5 h-3.5" /> All Landlords & Agents
          </span>
        )
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <Megaphone className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            Newsletters & Broadcasts
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Send corporate announcements, policy updates, and newsletters to Landlords and Agents.
          </p>
        </div>

        {isSuperAdminOrAdmin && (
          <button
            onClick={() => setShowCompose(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Create Newsletter
          </button>
        )}
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between ${
          statusMsg.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : 'bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Newsletter History / Feed */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <p className="text-xs text-gray-400">Loading broadcasts...</p>
          </div>
        ) : newsletters.length === 0 ? (
          <div className="text-center py-20 px-4">
            <Megaphone className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">No newsletters published yet</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              Super admins can compose and broadcast newsletters to keep landlords and agents informed.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {newsletters.map((nl) => (
              <div
                key={nl.id}
                className="p-5 hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-gray-900 dark:text-white truncate">
                      {nl.title}
                    </span>
                    {getTargetBadge(nl.targetRole)}
                  </div>

                  <p className="text-xs text-gray-500 line-clamp-2 pr-4">
                    {nl.content}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-gray-400 font-medium">
                    <span>Sent by: <strong className="text-gray-600 dark:text-gray-300">{nl.senderName}</strong></span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(nl.sentAt || nl.createdAt).toLocaleDateString('en-NG', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setViewingNewsletter(nl)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 rounded-xl transition"
                  >
                    <Eye className="w-3.5 h-3.5" /> Read
                  </button>

                  {isSuperAdminOrAdmin && (
                    <button
                      onClick={() => handleDelete(nl.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                      title="Delete newsletter"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compose Newsletter Modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 w-full max-w-2xl shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-200 dark:border-purple-800">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Compose Newsletter</h3>
                  <p className="text-xs text-gray-500">Broadcast a message to selected stakeholders</p>
                </div>
              </div>
              <button
                onClick={() => setShowCompose(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Target Audience
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'all', label: 'All Stakeholders', icon: Users },
                    { id: 'landlord', label: 'Landlords Only', icon: Building2 },
                    { id: 'agent', label: 'Agents Only', icon: Wrench },
                  ].map((aud) => {
                    const Icon = aud.icon
                    const isSelected = form.targetRole === aud.id
                    return (
                      <button
                        key={aud.id}
                        type="button"
                        onClick={() => setForm({ ...form, targetRole: aud.id })}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 ring-1 ring-purple-600'
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon className="w-4 h-4 mb-1" />
                        <span>{aud.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Subject / Headline *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. End of Month Financial Reconciliation Notice"
                  className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Content / Announcement *
                </label>
                <textarea
                  required
                  rows={6}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Write the full announcement here. Recipients will also receive a copy in their in-app messages..."
                  className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowCompose(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 transition"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Broadcasting...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Send & Broadcast
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Read Newsletter Full Modal */}
      {viewingNewsletter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 w-full max-w-2xl shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <div className="mb-1">{getTargetBadge(viewingNewsletter.targetRole)}</div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{viewingNewsletter.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Published by {viewingNewsletter.senderName} on {new Date(viewingNewsletter.sentAt || viewingNewsletter.createdAt).toLocaleDateString('en-NG', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <button
                onClick={() => setViewingNewsletter(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-2 text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed max-h-[60vh] overflow-y-auto">
              {viewingNewsletter.content}
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setViewingNewsletter(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
