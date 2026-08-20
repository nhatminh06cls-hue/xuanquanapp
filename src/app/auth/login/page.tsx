'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, ArrowRight, UserPlus, LogIn } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function LoginPageInner() {
  const router = useRouter()
  const params = useSearchParams()
  const redirectTo = params.get('redirectTo') ?? '/'

  const [mode, setMode]         = useState<'login' | 'register'>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập email và mật khẩu')
      return
    }
    if (password.length < 6) {
      setError('Mật khẩu tối thiểu 6 ký tự')
      return
    }

    setError('')
    setSuccess('')
    setIsLoading(true)
    const supabase = createClient()

    if (mode === 'login') {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      setIsLoading(false)
      if (err) {
        if (err.message.includes('Invalid login credentials')) {
          setError('Email hoặc mật khẩu không đúng')
        } else if (err.message.includes('Email not confirmed')) {
          setError('Vui lòng xác nhận email trước khi đăng nhập')
        } else {
          setError(err.message)
        }
        return
      }
      router.push(redirectTo)
      router.refresh()
    } else {
      // Register
      if (!fullName.trim()) { setError('Vui lòng nhập họ tên'); setIsLoading(false); return }
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      setIsLoading(false)
      if (err) { setError(err.message); return }
      setSuccess('✅ Đăng ký thành công! Kiểm tra email để xác nhận tài khoản.')
    }
  }

  async function handleGoogleLogin() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1463320898484-cdefecfec4e2?w=800&q=80')" }}
      />
      <div className="absolute inset-0 bg-surface/90 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-32 h-32 flex items-center justify-center drop-shadow-xl">
            <img
              src="/logo-xuanquan.png"
              alt="Làng Hoa Xuân Quan"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        <h1 className="text-2xl font-serif font-bold text-textMain text-center mb-1">
          {mode === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}
        </h1>
        <p className="text-sm text-textMuted text-center mb-6">
          {mode === 'login'
            ? 'Đăng nhập để mua sắm và theo dõi đơn hàng'
            : 'Gia nhập cộng đồng Làng Hoa Xuân Quan'}
        </p>

        {/* Mode toggle */}
        <div className="flex bg-surface rounded-xl p-1 mb-6 border border-border">
          <button
            onClick={() => { setMode('login'); setError(''); setSuccess('') }}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
              mode === 'login' ? 'bg-white text-primary shadow-sm' : 'text-textMuted'
            }`}>
            <LogIn className="w-3.5 h-3.5 inline mr-1.5" />Đăng nhập
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); setSuccess('') }}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
              mode === 'register' ? 'bg-white text-primary shadow-sm' : 'text-textMuted'
            }`}>
            <UserPlus className="w-3.5 h-3.5 inline mr-1.5" />Đăng ký
          </button>
        </div>

        <div className="space-y-3">
          {/* Full name — only register */}
          {mode === 'register' && (
            <Input
              type="text"
              placeholder="Họ và tên"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
            />
          )}

          {/* Email */}
          <Input
            type="email"
            placeholder="Email của bạn"
            value={email}
            onChange={e => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />

          {/* Password */}
          <div className="relative">
            <Input
              type={showPw ? 'text' : 'password'}
              placeholder={mode === 'register' ? 'Mật khẩu (tối thiểu 6 ký tự)' : 'Mật khẩu'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              error={error}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-textMain transition"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-medium">
              {success}
            </div>
          )}

          <Button onClick={handleSubmit} loading={isLoading} className="w-full h-12" variant="primary">
            {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
            <ArrowRight className="w-4 h-4" />
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] text-textMuted uppercase font-bold tracking-wider">Hoặc</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            className="w-full h-12 bg-white border border-border font-bold rounded-xl flex items-center justify-center gap-3 text-sm text-textMain hover:bg-surface transition shadow-sm active:scale-[0.98]"
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" className="w-5 h-5" />
            Tiếp tục với Google
          </button>
        </div>

        {/* Vendor link */}
        <p className="text-center text-[11px] text-textMuted mt-6">
          Là nhà vườn?{' '}
          <a href="#" className="font-bold text-primary underline underline-offset-4">
            Đăng ký tài khoản nhà vườn
          </a>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-textMuted text-sm">Đang tải...</div>
      </div>
    }>
      <LoginPageInner />
    </Suspense>
  )
}
