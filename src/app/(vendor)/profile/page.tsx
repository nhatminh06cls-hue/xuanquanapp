import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getCurrentUser } from '@/lib/actions/auth'
import { getMyGarden } from '@/lib/actions/vendor'
import { GardenProfileEditor } from './GardenProfileEditor'
import { CreateGardenForm } from './CreateGardenForm'

export const metadata: Metadata = { title: 'Hồ sơ vườn | Xuân Quan Vendor' }

export default async function GardenProfilePage() {
  const session = await getCurrentUser()
  if (!session) redirect('/auth/login?redirectTo=/profile')

  const garden = await getMyGarden()

  // Chưa có vườn → hiện form tạo vườn (không redirect sai)
  if (!garden) {
    return <CreateGardenForm />
  }

  return (
    <div className="bg-surface min-h-screen pb-24">
      {/* Header */}
      <div className="bg-primary px-5 pt-14 pb-6">
        <p className="text-white/70 text-xs mb-0.5">Quản lý thương hiệu</p>
        <h1 className="text-xl font-serif font-bold text-white">{(garden as any).name}</h1>
        <p className="text-white/60 text-xs mt-1">
          Câu chuyện hay → Khách tin tưởng → Bán được hàng
        </p>
      </div>

      {/* Tip banner */}
      <div className="mx-5 mt-4 mb-5 bg-secondary/10 border border-secondary/25 rounded-2xl p-4">
        <p className="text-xs font-bold text-secondary mb-1">💡 Tại sao cần câu chuyện?</p>
        <p className="text-[11px] text-textMuted leading-relaxed">
          Khách hàng mua hoa không chỉ mua sản phẩm — họ mua câu chuyện đằng sau. 
          Một nhà vườn có tagline và story rõ ràng thường được nhớ đến lâu hơn và tạo được lòng trung thành.
        </p>
      </div>

      <div className="px-5">
        <GardenProfileEditor garden={garden as any} />
      </div>
    </div>
  )
}
