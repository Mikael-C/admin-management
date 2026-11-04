'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/components/providers/auth-context'
import { messagesApi } from '@/lib/api-client'
import { formatDate } from '@/lib/utils'
import {
  MessageSquare, Send, Search, Loader2, User,
  Plus, X, ChevronLeft, Circle, CheckCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function MessagesPage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [activeThread, setActiveThread] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [subject, setSubject] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showNewMsg, setShowNewMsg] = useState(false)
  const [selectedContact, setSelectedContact] = useState<any>(null)
  const [searchContacts, setSearchContacts] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadConversations()
    loadContacts()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadConversations() {
    setLoading(true)
    try {
      const res: any = await messagesApi.conversations()
      setConversations(res.conversations || [])
      const totalUnread = (res.conversations || []).reduce((s: number, c: any) => s + c.unreadCount, 0)
      setUnreadCount(totalUnread)
    } catch {}
    setLoading(false)
  }

  async function loadContacts() {
    try {
      const res: any = await messagesApi.contacts()
      setContacts(res.contacts || [])
    } catch {}
  }

  async function openThread(contact: any) {
    setActiveThread(contact)
    setShowNewMsg(false)
    try {
      const res: any = await messagesApi.thread(contact.id)
      setMessages(res.messages || [])
      // Update unread in sidebar
      setConversations(prev =>
        prev.map(c => c.contact.id === contact.id ? { ...c, unreadCount: 0 } : c)
      )
    } catch {}
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim()) return
    if (!activeThread && !selectedContact) return

    setSending(true)
    try {
      const receiverId = activeThread?.id || selectedContact?.id
      const res = await messagesApi.send({
        receiverId,
        content: newMessage.trim(),
        subject: subject.trim() || undefined,
      }) as any

      if (activeThread) {
        setMessages(prev => [...prev, res.message])
      } else {
        // Start a new thread
        setActiveThread(selectedContact)
        setMessages([res.message])
        setShowNewMsg(false)
        setSelectedContact(null)
        await loadConversations()
      }
      setNewMessage('')
      setSubject('')
    } catch (err: any) {
      alert(err.message || 'Failed to send message')
    }
    setSending(false)
  }

  const filteredContacts = contacts.filter(c =>
    !searchContacts || c.name.toLowerCase().includes(searchContacts.toLowerCase())
  )

  const roleColor: Record<string, string> = {
    super_admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300',
    admin: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300',
    landlord: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
    agent: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300',
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            Messages
            {unreadCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white font-bold">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {user?.role === 'landlord' || user?.role === 'agent'
              ? 'Communicate directly with the admin team'
              : 'Send messages to landlords, agents, and staff'}
          </p>
        </div>
        <button
          onClick={() => { setShowNewMsg(true); setActiveThread(null) }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow transition"
        >
          <Plus className="w-4 h-4" /> New Message
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-0 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden min-h-0">
        {/* ── Sidebar: Conversations ── */}
        <div className="border-r border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Conversations</p>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-400">
              <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-xs">No conversations yet.</p>
              <p className="text-xs mt-1">Click &quot;New Message&quot; to start one.</p>
            </div>
          ) : (
            <ul className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
              {conversations.map((conv) => (
                <li key={conv.contact.id}>
                  <button
                    onClick={() => openThread(conv.contact)}
                    className={cn(
                      'w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition flex items-start gap-3',
                      activeThread?.id === conv.contact.id && 'bg-blue-50 dark:bg-blue-950/30'
                    )}
                  >
                    <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0 font-bold text-gray-700 dark:text-gray-200 text-sm">
                      {conv.contact.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={cn('text-sm font-semibold truncate text-gray-900 dark:text-white', conv.unreadCount > 0 && 'font-bold')}>
                          {conv.contact.name}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-blue-500 text-white font-bold shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', roleColor[conv.contact.role] || '')}>
                        {conv.contact.role.replace('_', ' ')}
                      </span>
                      {conv.lastMessage && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {conv.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Main Chat Area ── */}
        <div className="col-span-2 flex flex-col overflow-hidden">

          {/* New Message Compose */}
          {showNewMsg && (
            <div className="flex-1 flex flex-col p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white">Compose New Message</h3>
                <button onClick={() => setShowNewMsg(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contact search */}
              <div className="mb-3">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">To:</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    placeholder="Search contacts..."
                    value={searchContacts}
                    onChange={e => setSearchContacts(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  {filteredContacts.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedContact(c)}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2',
                        selectedContact?.id === c.id && 'bg-blue-50 dark:bg-blue-950/30 font-semibold'
                      )}
                    >
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-white">{c.name}</span>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium ml-auto', roleColor[c.role] || '')}>
                        {c.role.replace('_', ' ')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedContact && (
                <div className="mb-2 px-2 py-1 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <CheckCheck className="w-3.5 h-3.5" />
                  To: <strong>{selectedContact.name}</strong>
                </div>
              )}

              <input
                placeholder="Subject (optional)"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="mb-3 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <form onSubmit={sendMessage} className="flex flex-col gap-2 flex-1">
                <textarea
                  placeholder="Write your message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  rows={6}
                  className="flex-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <button
                  type="submit"
                  disabled={sending || !selectedContact || !newMessage.trim()}
                  className="self-end bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send Message
                </button>
              </form>
            </div>
          )}

          {/* Active Thread */}
          {activeThread && !showNewMsg && (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
                <button
                  onClick={() => setActiveThread(null)}
                  className="md:hidden text-gray-400 hover:text-gray-600"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center font-bold text-blue-700 dark:text-blue-300">
                  {activeThread.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{activeThread.name}</p>
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', roleColor[activeThread.role] || '')}>
                    {activeThread.role.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 text-sm py-10">No messages yet. Say hello!</div>
                ) : (
                  messages.map((msg: any) => {
                    const isMine = msg.senderId === user?.id
                    return (
                      <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                        {!isMine && (
                          <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 mr-2 shrink-0 self-end">
                            {msg.sender?.name?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className={cn(
                          'max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-xs',
                          isMine
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm'
                        )}>
                          {msg.subject && (
                            <p className={cn('text-xs font-semibold mb-1', isMine ? 'text-blue-100' : 'text-gray-500')}>
                              Re: {msg.subject}
                            </p>
                          )}
                          <p className="leading-relaxed">{msg.content}</p>
                          <p className={cn('text-[10px] mt-1', isMine ? 'text-blue-100/70' : 'text-gray-400')}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {' · '}
                            {new Date(msg.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Box */}
              <form onSubmit={sendMessage} className="border-t border-gray-200 dark:border-gray-800 p-3 flex items-end gap-2">
                <textarea
                  placeholder={`Reply to ${activeThread.name}...`}
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  rows={2}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e as any) }
                  }}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition shrink-0"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </>
          )}

          {/* Empty state */}
          {!activeThread && !showNewMsg && (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
              <MessageSquare className="w-14 h-14 mb-4 opacity-20" />
              <p className="text-base font-semibold text-gray-500 dark:text-gray-400">Select a conversation</p>
              <p className="text-xs mt-1">or click &ldquo;New Message&rdquo; to start a conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

