import { CustomerBottomNav } from '@/components/shared/BottomNav'

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="pb-24">{children}</main>
      <CustomerBottomNav />
    </>
  )
}
