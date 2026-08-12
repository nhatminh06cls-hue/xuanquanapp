import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/types/database.types'

/**
 * Supabase client cho MIDDLEWARE
 * Dùng riêng vì middleware có API cookies khác với Server Components
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
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
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              // Safari/iPhone ITP fix: phải là 'lax' để cookie được set sau OAuth redirect
              sameSite: 'lax',
            })
          )
        },
      },
    }
  )

  // Refresh session token — QUAN TRỌNG: không được xóa code này
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabaseResponse, user }
}
