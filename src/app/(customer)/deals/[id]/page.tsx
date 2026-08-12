import { notFound, redirect } from 'next/navigation'
import { getNegotiationDetail } from '@/lib/actions/negotiations'
import { getCurrentUser } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/server'
import DealChatClient from './DealChatClient'

export default async function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getCurrentUser()
  if (!session) redirect('/auth/login?redirectTo=/deals/' + id)

  const data = await getNegotiationDetail(id)
  if (!data) notFound()

  const { negotiation: neg } = data
  const myId = session.user.id

  // Xác định role: buyer hay seller
  const supabase = await createClient()
  const { data: garden } = await supabase
    .from('gardens')
    .select('owner_id')
    .eq('id', neg.garden_id)
    .single()

  const isSeller = (garden as any)?.owner_id === myId
  const isBuyer  = neg.buyer_id === myId

  if (!isSeller && !isBuyer) notFound()

  return (
    <DealChatClient
      initialData={data}
      myId={myId}
      myRole={isSeller ? 'seller' : 'buyer'}
    />
  )
}
