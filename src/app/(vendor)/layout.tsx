import { VendorBottomNav } from '@/components/shared/VendorBottomNav'
import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUser()
  if (!session) redirect('/auth/login?redirectTo=/dashboard')

  // Lấy số đơn chờ xác nhận để hiện badge
  const supabase = await createClient()
  const { count } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

  return (
    <>
      <main className="pb-24 min-h-screen bg-surface">{children}</main>
      <VendorBottomNav pendingOrderCount={count ?? 0} />
    </>
  )
}
