import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">Status Page</h1>
        </div>
        <nav className="p-4">
          <ul className="space-y-1">
            {/* <li>
              <Link 
                href="/dashboard" 
                className="block px-4 py-2 text-gray-700 rounded hover:bg-gray-100"
              >
                Dashboard
              </Link>
            </li> */}
            <li>
              <Link 
                href="/dashboard/services" 
                className="block px-4 py-2 text-gray-700 rounded hover:bg-gray-100"
              >
                Services
              </Link>
            </li>
            <li>
              <Link 
                href="/dashboard/incidents" 
                className="block px-4 py-2 text-gray-700 rounded hover:bg-gray-100"
              >
                Incidents
              </Link>
            </li>
            <li>
              <Link 
                href="/dashboard/maintenance" 
                className="block px-4 py-2 text-gray-700 rounded hover:bg-gray-100"
              >
                Maintenance
              </Link>
            </li>
            <li>
              <Link 
                href="/dashboard/team" 
                className="block px-4 py-2 text-gray-700 rounded hover:bg-gray-100"
              >
                Team
              </Link>
            </li>
            <li>
              <Link 
                href="/dashboard/settings" 
                className="block px-4 py-2 text-gray-700 rounded hover:bg-gray-100"
              >
                Settings
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1">
        <header className="flex items-center justify-end w-full h-16 px-6 bg-white border-b">
          <UserButton afterSignOutUrl="/" />
        </header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 