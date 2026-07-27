import OrderNotifications from "@/components/admin/OrderNotifications";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <OrderNotifications />
      {children}
    </>
  );
}