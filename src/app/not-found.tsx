import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800">404 - Page Not Found</h1>
        <p className="text-gray-600 mt-2">The page you are looking for doesn't exist or has been moved.</p>
        <div className="mt-6">
          <Link 
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
} 