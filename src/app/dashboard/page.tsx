import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="mb-2 text-lg font-semibold">Services</h2>
          <p className="text-gray-600">Manage your services and their statuses</p>
        </div>
        
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="mb-2 text-lg font-semibold">Incidents</h2>
          <p className="text-gray-600">Track and manage service incidents</p>
        </div>
        
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="mb-2 text-lg font-semibold">Maintenance</h2>
          <p className="text-gray-600">Schedule and manage maintenance windows</p>
        </div>
      </div>
    </div>
  );
} 