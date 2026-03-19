import { Navbar } from "@/components/navbar";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
    </>
  );
}
