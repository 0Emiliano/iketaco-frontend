import AdminBottomNav from '@/components/admin/AdminBottomNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <AdminBottomNav />
    </>
  )
}
