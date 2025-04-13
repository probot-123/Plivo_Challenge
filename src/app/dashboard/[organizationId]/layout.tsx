import RealtimeNotifications from './components/RealtimeNotifications';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { organizationId: string };
}) {
  const { organizationId } = params;
  
  // Auth check
  const { userId } = auth();
  if (!userId) {
    redirect('/sign-in');
  }
  
  // Get organization data
  const organization = await organizationRepository.findById(organizationId);
  
  if (!organization) {
    notFound();
  }

  return (
    <div className="flex h-screen">
      <DashboardSidebar organization={organization} />
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b flex items-center justify-between px-4">
          <h1 className="text-xl font-semibold">{organization.name}</h1>
          <div className="flex items-center space-x-2">
            <RealtimeNotifications organizationId={organizationId} />
            <UserButton />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 