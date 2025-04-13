'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

export default function SettingsPage() {
  const { userId, isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Success message
      setMessage({ 
        type: "success", 
        text: "Settings saved successfully!" 
      });
    } catch (error) {
      // Error message
      setMessage({ 
        type: "error", 
        text: "Failed to save settings. Please try again." 
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded || !isSignedIn) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>
      
      <div className="max-w-2xl p-6 bg-white rounded-lg shadow">
        <h2 className="mb-4 text-lg font-semibold">User Profile</h2>
        
        <div className="mb-6 space-y-2">
          <p className="text-sm text-gray-500">Your profile is managed through Clerk.</p>
          <p className="text-sm text-gray-500">Click on your profile picture in the top-right corner to manage your account settings.</p>
        </div>

        <h2 className="mb-4 text-lg font-semibold">Organization Settings</h2>
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="mb-4">
            <label htmlFor="orgName" className="block mb-2 text-sm font-medium text-gray-700">
              Organization Name
            </label>
            <input
              type="text"
              id="orgName"
              placeholder="Enter organization name"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
            />
          </div>
          
          <div className="mb-4">
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
                placeholder="my-org"
                className="w-full px-3 py-2 border rounded-r-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value)}
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              This will be used for your public status page URL.
            </p>
          </div>
          
          {message.text && (
            <div className={`mb-4 p-3 rounded-md ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {message.text}
            </div>
          )}
          
          <button 
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 text-white bg-primary rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
} 