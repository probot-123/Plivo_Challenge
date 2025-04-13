import Script from 'next/script';

export default function StatusPageLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto py-4 px-6">
          <nav className="flex justify-between items-center">
            <div>
              <a href="/" className="text-xl font-bold text-blue-600">Status Page</a>
            </div>
            <div>
              <a 
                href="/dashboard" 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Dashboard
              </a>
            </div>
          </nav>
        </div>
      </header>
      
      <main className="py-6">
        {children}
      </main>
      
      <footer className="bg-white border-t py-6">
        <div className="container mx-auto px-6 text-center text-gray-500">
          <p>© {new Date().getFullYear()} Status Page Application</p>
        </div>
      </footer>
      
      {/* Real-time updates script */}
      <Script id="socket-io-client" src="https://cdn.socket.io/4.6.0/socket.io.min.js" />
    </div>
  );
} 