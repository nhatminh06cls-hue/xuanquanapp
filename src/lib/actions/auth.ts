'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Server Action: Đăng nhập bằng Google OAuth
 * Gọi từ Client Component: <form action={signInWithGoogle}>
 */
export async function signInWithGoogle() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    redirect('/auth/login?error=oauth_failed')
  }

  if (data.url) {
    redirect(data.url)
  }
}

/**
 * Server Action: Gửi OTP qua số điện thoại
 */
export async function signInWithPhone(phone: string) {
  const supabase = await createClient()

  // Format phone về dạng quốc tế (+84...)
  const formattedPhone = phone.startsWith('0')
    ? '+84' + phone.slice(1)
    : phone

  const { error } = await supabase.auth.signInWithOtp({
    phone: formattedPhone,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, phone: formattedPhone }
}

/**
 * Server Action: Xác minh OTP từ SMS
 */
export async function verifyPhoneOtp(phone: string, token: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

/**
 * Server Action: Đăng xuất
 */
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

/**
 * Server Action: Lấy user hiện tại (dùng trong Server Components)
 * Dùng getUser() thay vì getSession() để bảo mật hơn
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) return null

  // Lấy profile kèm role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { user, profile }
}
