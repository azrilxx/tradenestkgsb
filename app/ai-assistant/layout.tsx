import { Sidebar } from '@/components/dashboard/sidebar';

export default function AIAssistantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-72 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
