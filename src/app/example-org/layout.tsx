export default function ExampleOrgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="status-page-header py-4 shadow-sm">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-xl font-bold">Example Organization</span>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-grow">{children}</main>
    </div>
  );
} 