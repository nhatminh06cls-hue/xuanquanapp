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
  const redirectTo = requestUrl.searchParams.get('redirectTo') ?? '/'
  const redirectUrl = new URL(redirectTo, requestUrl.origin)

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

  // Tạo redirect và copy cookies vào response — bắt buộc cho Safari
  const response = NextResponse.redirect(redirectUrl)
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
