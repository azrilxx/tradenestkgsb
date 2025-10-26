import { Sidebar } from '@/components/dashboard/sidebar';

export default function AssociationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-72">
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

