/**
 * Barrel export cho lib/supabase
 * Import từ '@/lib/supabase' thay vì chỉ định file cụ thể
 *
 * Lưu ý: client và server KHÔNG thể dùng lẫn nhau
 * - Server Components/Actions: import { createClient } from '@/lib/supabase/server'
 * - Client Components:         import { createClient } from '@/lib/supabase/client'
 */
export { createClient as createServerClient } from './server'
export { createClient as createBrowserClient } from './client'
export { updateSession } from './middleware'
