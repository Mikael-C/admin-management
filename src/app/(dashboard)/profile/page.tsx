'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/auth-context'
import { profileApi, authApi } from '@/lib/api-client'
import { formatDate } from '@/lib/utils'
import {
  User, Building2, Phone, Mail, MapPin, Loader2, Save,
  Lock, Eye, EyeOff, ShieldCheck, Briefcase, CreditCard,
  IdCard, Award, CheckCircle2, AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'profile' | 'password'>('profile')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Profile form
  const [form, setForm] = useState<Record<string, string>>({})

  // Password form
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false })
  const [pwError, setPwError] = useState('')
  const [pwSaved, setPwSaved] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    setLoading(true)
    try {
      const res = await profileApi.me()
      setProfile(res.profile)
      // Pre-fill form with current values
      const p = res.profile
      const rp = p.roleProfile
      setForm({
        name: p.name || '',
        phone: p.phone || '',
        avatar: p.avatar || '',
        address: rp?.address || '',
        bio: rp?.bio || '',
        bankName: rp?.bankName || '',
        accountNumber: rp?.accountNumber || '',
        accountName: rp?.accountName || '',
        nin: rp?.nin || '',
        licenseNo: rp?.licenseNo || '',
        department: rp?.department || '',
        position: rp?.position || '',
        staffId: rp?.staffId || '',
      })
    } catch {}
    setLoading(false)
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await profileApi.update(form)
      await refreshUser()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      await loadProfile()
    } catch (err: any) {
      setError(err.message || 'Failed to save profile.')
    }
    setSaving(false)
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    if (pwForm.newPw !== pwForm.confirm) {
      setPwError('New passwords do not match.')
      return
    }
    if (pwForm.newPw.length < 6) {
      setPwError('Password must be at least 6 characters.')
      return
    }
    setSaving(true)
    try {
      await authApi.changePassword(pwForm.current, pwForm.newPw)
      setPwSaved(true)
      setPwForm({ current: '', newPw: '', confirm: '' })
      setTimeout(() => setPwSaved(false), 4000)
    } catch (err: any) {
      setPwError(err.message || 'Failed to change password.')
    }
    setSaving(false)
  }

  const isSuperAdmin = user?.role === 'super_admin'
  const isAdmin = user?.role === 'admin' || isSuperAdmin
  const isLandlord = user?.role === 'landlord'
  const isAgent = user?.role === 'agent'

  const roleLabels: Record<string, { label: string; color: string; icon: any }> = {
    super_admin: { label: 'Super Administrator', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800', icon: ShieldCheck },
    admin: { label: 'Admin Staff', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800', icon: Briefcase },
    landlord: { label: 'Landlord', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800', icon: Building2 },
    agent: { label: 'Field Agent', color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800', icon: Award },
  }

  const roleInfo = roleLabels[user?.role || ''] || roleLabels.admin
  const RoleIcon = roleInfo.icon

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const rp = profile?.roleProfile

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-black border-2 border-white/40 shadow-lg">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-black">{profile?.name}</h1>
            <p className="text-blue-100 text-sm">{profile?.email}</p>
            {profile?.phone && <p className="text-blue-100/80 text-xs mt-0.5">{profile?.phone}</p>}
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-xs font-semibold">
              <RoleIcon className="w-3.5 h-3.5" />
              {roleInfo.label}
            </div>
          </div>
          <div className="text-right hidden sm:block text-xs text-blue-100/60">
            <p>Member since</p>
            <p className="text-blue-100 font-semibold">{formatDate(profile?.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        {(['profile', 'password'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-5 py-2.5 text-sm font-semibold capitalize border-b-2 -mb-px transition',
              tab === t
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            {t === 'profile' ? '👤 Profile Details' : '🔒 Change Password'}
          </button>
        ))}
      </div>

      {/* Profile Form */}
      {tab === 'profile' && (
        <form onSubmit={saveProfile} className="space-y-5">
          {saved && (
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Profile updated successfully!
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" /> Basic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name *" icon={<User className="w-3.5 h-3.5" />}>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className={inputCls} placeholder="Your full name" />
              </Field>
              <Field label="Phone Number" icon={<Phone className="w-3.5 h-3.5" />}>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  className={inputCls} placeholder="08012345678" />
              </Field>
            </div>
            <Field label="Email Address" icon={<Mail className="w-3.5 h-3.5" />}>
              <input value={profile?.email || ''} disabled
                className={cn(inputCls, 'opacity-60 cursor-not-allowed')} />
            </Field>
          </div>

          {/* Role-specific fields */}
          {(isLandlord || isAgent) && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" /> Contact & Profile
              </h3>
              <Field label="Address" icon={<MapPin className="w-3.5 h-3.5" />}>
                <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                  className={inputCls} placeholder="Your address" />
              </Field>
              <Field label="Bio / About" icon={<User className="w-3.5 h-3.5" />}>
                <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })}
                  rows={3} className={cn(inputCls, 'resize-none')} placeholder="Brief description about yourself" />
              </Field>
              {isLandlord && (
                <Field label="NIN (National ID)" icon={<IdCard className="w-3.5 h-3.5" />}>
                  <input value={form.nin} onChange={e => setForm({ ...form, nin: e.target.value })}
                    className={inputCls} placeholder="National Identification Number" />
                </Field>
              )}
              {isAgent && (
                <Field label="License Number" icon={<Award className="w-3.5 h-3.5" />}>
                  <input value={form.licenseNo} onChange={e => setForm({ ...form, licenseNo: e.target.value })}
                    className={inputCls} placeholder="Real estate agent license" />
                </Field>
              )}
            </div>
          )}

          {/* Admin-specific */}
          {isAdmin && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-500" /> Work Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Department" icon={<Briefcase className="w-3.5 h-3.5" />}>
                  <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                    className={inputCls} placeholder="e.g. Operations" />
                </Field>
                <Field label="Position" icon={<Award className="w-3.5 h-3.5" />}>
                  <input value={form.position} onChange={e => setForm({ ...form, position: e.target.value })}
                    className={inputCls} placeholder="e.g. Senior Manager" />
                </Field>
                <Field label="Staff ID" icon={<IdCard className="w-3.5 h-3.5" />}>
                  <input value={form.staffId} onChange={e => setForm({ ...form, staffId: e.target.value })}
                    className={inputCls} placeholder="SA-001" />
                </Field>
              </div>
            </div>
          )}

          {/* Bank Account (Landlords & Agents only — NOT super_admin) */}
          {(isLandlord || isAgent || (isAdmin && !isSuperAdmin)) && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-500" /> Bank Account Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Bank Name" icon={<CreditCard className="w-3.5 h-3.5" />}>
                  <input value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })}
                    className={inputCls} placeholder="e.g. First Bank, GTBank" />
                </Field>
                <Field label="Account Number" icon={<CreditCard className="w-3.5 h-3.5" />}>
                  <input value={form.accountNumber} onChange={e => setForm({ ...form, accountNumber: e.target.value })}
                    className={inputCls} placeholder="10-digit account number" maxLength={10} />
                </Field>
                <Field label="Account Name" icon={<User className="w-3.5 h-3.5" />}>
                  <input value={form.accountName} onChange={e => setForm({ ...form, accountName: e.target.value })}
                    className={inputCls} placeholder="Name on bank account" />
                </Field>
              </div>
            </div>
          )}

          {/* Note for super_admin: no bank fields */}
          {isSuperAdmin && (
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 px-4 py-3 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              Bank account details are not displayed for the Super Administrator account for security reasons.
            </div>
          )}

          <div className="flex justify-end">
            <button type="submit" disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow transition">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Profile
            </button>
          </div>
        </form>
      )}

      {/* Password Tab */}
      {tab === 'password' && (
        <form onSubmit={changePassword} className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-500" /> Change Password
            </h3>

            {pwSaved && (
              <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-2.5">
                <CheckCircle2 className="w-4 h-4" /> Password changed successfully!
              </div>
            )}
            {pwError && (
              <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">
                <AlertCircle className="w-4 h-4" /> {pwError}
              </div>
            )}

            {(['current', 'new', 'confirm'] as const).map(key => (
              <div key={key}>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block capitalize">
                  {key === 'current' ? 'Current Password' : key === 'new' ? 'New Password' : 'Confirm New Password'} *
                </label>
                <div className="relative">
                  <input
                    type={showPw[key] ? 'text' : 'password'}
                    required
                    value={pwForm[key === 'new' ? 'newPw' : key === 'confirm' ? 'confirm' : 'current']}
                    onChange={e => {
                      const field = key === 'new' ? 'newPw' : key === 'confirm' ? 'confirm' : 'current'
                      setPwForm({ ...pwForm, [field]: e.target.value })
                    }}
                    className={cn(inputCls, 'pr-10')}
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPw({ ...showPw, [key]: !showPw[key] })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPw[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-2">
              <button type="submit" disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow transition">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Update Password
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}

// Helper components
const inputCls = 'w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition'

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
        <span className="text-gray-400">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  )
}
