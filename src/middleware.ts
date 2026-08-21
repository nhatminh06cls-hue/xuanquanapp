import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware chạy trước mọi request:
 * 1. Refresh Supabase session (bắt buộc theo docs SSR)
 * 2. Vendor mở app → redirect /dashboard
 * 3. Vendor routes chưa đăng nhập → redirect /auth/login
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  // ── Supabase SSR client (refresh session) ──────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Đọc session từ cookie — không cần network call (getUser() thì có)
  // Đủ để routing, còn data access dùng getUser() trong server components/actions
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  const { pathname } = request.nextUrl
  const role = request.cookies.get('xq_role')?.value

  // ── Vendor routes: phải đăng nhập ────────────────────────────
  const VENDOR_ROOTS = ['/dashboard', '/orders', '/inventory', '/reports', '/profile', '/products', '/deals']
  const isVendorRoute = VENDOR_ROOTS.some(
    r => pathname === r || pathname.startsWith(r + '/')
  )

  if (isVendorRoute && !user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Auth routes: đã đăng nhập rồi → về đúng giao diện ────────
  if (pathname.startsWith('/auth/login') && user) {
    const dest = role === 'vendor' ? '/dashboard' : '/'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  return response
}

export const config = {
  // Bỏ qua static files, images, fonts
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|logo.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
  ],
}
