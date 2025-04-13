import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Status Page Application</h1>
      {/* <p className="text-xl mb-4">A status page application similar to status.io</p> */}
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Public Status Page</h2>
          <p className="mb-4">View the public-facing status page showing service status, incidents, and scheduled maintenance.</p>
          <Link 
            href="/example-org" 
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            View Demo Status Page
          </Link>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
          <p className="mb-4">Manage services, report incidents, and schedule maintenance through the admin dashboard.</p>
          <Link 
            href="/dashboard" 
            className="inline-block px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
          >
            Access Dashboard
          </Link>
        </div>
      </div>
      
      <div className="mt-12 text-center max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">Key Features</h2>
        <ul className="space-y-2 text-left">
          <li className="flex items-start">
            <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 mt-1">✓</span>
            <span>Real-time service status monitoring</span>
          </li>
          <li className="flex items-start">
            <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 mt-1">✓</span>
            <span>Incident reporting and updates</span>
          </li>
          <li className="flex items-start">
            <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 mt-1">✓</span>
            <span>Scheduled maintenance management</span>
          </li>
          <li className="flex items-start">
            <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 mt-1">✓</span>
            <span>Multi-tenant support for organizations</span>
          </li>
          <li className="flex items-start">
            <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 mt-1">✓</span>
            <span>Secure authentication and team management</span>
          </li>
        </ul>
      </div>
    </div>
  );
} 