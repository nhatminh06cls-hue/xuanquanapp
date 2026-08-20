import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Route Handler: /auth/callback
 * Supabase OAuth (Google) redirect về đây sau khi đăng nhập thành công.
 *
 * Fix Safari/iPhone ITP:
 * - Set cookie với sameSite: 'lax' để Safari chấp nhận
 * - Forward đúng Set-Cookie headers vào redirect response
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  // Hỗ trợ cả 'next' (từ Google OAuth) và 'redirectTo' (từ email login)
  const next = requestUrl.searchParams.get('next')
    ?? requestUrl.searchParams.get('redirectTo')
    ?? '/'
  const redirectUrl = new URL(next, requestUrl.origin)

  if (!code) {
    return NextResponse.redirect(redirectUrl)
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, {
              ...options,
              // Safari/iPhone ITP fix: 'lax' không phải 'strict'
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              httpOnly: true,
            })
          })
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] lỗi:', error.message)
    const errorUrl = new URL('/auth/login', requestUrl.origin)
    errorUrl.searchParams.set('error', 'oauth_error')
    return NextResponse.redirect(errorUrl)
  }

  // Smart redirect: nếu không có next cụ thể, kiểm tra xem user có vườn không
  let finalDestination = next
  if (next === '/') {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: garden } = await supabase
        .from('gardens').select('id').eq('owner_id', user.id).maybeSingle()
      if (garden) finalDestination = '/dashboard'
    }
  }

  const finalUrl = new URL(finalDestination, requestUrl.origin)

  // Tạo redirect và copy cookies vào response — bắt buộc cho Safari
  const response = NextResponse.redirect(finalUrl)
  cookieStore.getAll().forEach(({ name, value }) => {
    response.cookies.set(name, value, {
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      path: '/',
    })
  })

  return response
}
