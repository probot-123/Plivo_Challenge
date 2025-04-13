import { auth, currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const { userId } = auth();
  
  if (!userId) {
    redirect("/sign-in");
  }
  
  const user = await currentUser();
  
  return (
    <div className="flex items-center justify-center min-h-screen py-12 bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Welcome to Status Page</h1>
          <p className="text-gray-600">Let's set up your organization</p>
        </div>
        
        <form className="space-y-6">
          <div>
            <label htmlFor="orgName" className="block mb-2 text-sm font-medium text-gray-700">
              Organization Name
            </label>
            <input
              type="text"
              id="orgName"
              placeholder="Acme Inc."
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          
          <div>
            <label htmlFor="orgSlug" className="block mb-2 text-sm font-medium text-gray-700">
              Organization Slug
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">
                status.yourdomain.com/
              </span>
              <input
                type="text"
                id="orgSlug"
                placeholder="acme"
                className="w-full px-3 py-2 border rounded-r-md"
                required
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              This will be used for your public status page URL.
            </p>
          </div>
          
          <div>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="w-4 h-4 text-primary" />
              <span className="text-sm text-gray-700">Make status page public</span>
            </label>
          </div>
          
          <button 
            type="submit"
            className="w-full px-4 py-2 text-white bg-primary rounded-md hover:bg-primary/90"
          >
            Create Organization
          </button>
        </form>
      </div>
    </div>
  );
} 