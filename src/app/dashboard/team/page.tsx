'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

// Team member role options
const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' }
];

// Interface definitions
type TeamMember = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: 'active' | 'pending' | 'inactive';
  avatar?: string;
  joinedAt: string;
};

export default function TeamPage() {
  const params = useParams();
  const organizationId = params.organizationId as string;
  
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state
  const [isInviteFormOpen, setIsInviteFormOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('viewer');
  
  // Fetch team members
  useEffect(() => {
    if (!organizationId) return;
    
    // Simulated data - in a real app, this would fetch from an API
    const dummyMembers: TeamMember[] = [
      {
        id: '1',
        email: 'alice@example.com',
        name: 'Alice Johnson',
        role: 'admin',
        status: 'active',
        avatar: 'https://ui-avatars.com/api/?name=Alice+Johnson&background=0D8ABC&color=fff',
        joinedAt: '2023-01-15T08:30:00.000Z'
      },
      {
        id: '2',
        email: 'bob@example.com',
        name: 'Bob Smith',
        role: 'editor',
        status: 'active',
        avatar: 'https://ui-avatars.com/api/?name=Bob+Smith&background=F97316&color=fff',
        joinedAt: '2023-02-20T14:45:00.000Z'
      },
      {
        id: '3',
        email: 'charlie@example.com',
        name: 'Charlie Davis',
        role: 'viewer',
        status: 'active',
        avatar: 'https://ui-avatars.com/api/?name=Charlie+Davis&background=22C55E&color=fff',
        joinedAt: '2023-03-10T11:15:00.000Z'
      },
      {
        id: '4',
        email: 'dan@example.com',
        name: 'Dan Wilson',
        role: 'viewer',
        status: 'pending',
        joinedAt: '2023-04-05T09:00:00.000Z'
      }
    ];
    
    setMembers(dummyMembers);
    setLoading(false);
  }, [organizationId]);
  
  // Open invite form
  const openInviteForm = () => {
    setEmail('');
    setName('');
    setRole('viewer');
    setIsInviteFormOpen(true);
  };
  
  // Close invite form
  const closeInviteForm = () => {
    setIsInviteFormOpen(false);
  };
  
  // Handle invite submission
  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    // In a real app, this would send the invitation via API
    const newMember: TeamMember = {
      id: `temp-${Date.now()}`,
      email,
      name: name || email.split('@')[0],
      role,
      status: 'pending',
      joinedAt: new Date().toISOString()
    };
    
    setMembers([...members, newMember]);
    closeInviteForm();
  };
  
  // Handle role change
  const handleRoleChange = (memberId: string, newRole: string) => {
    // In a real app, this would update the role via API
    setMembers(members.map(member => 
      member.id === memberId
        ? { ...member, role: newRole }
        : member
    ));
  };
  
  // Handle member removal
  const handleRemoveMember = (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) {
      return;
    }
    
    // In a real app, this would remove the member via API
    setMembers(members.filter(member => member.id !== memberId));
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Team Members</h1>
        <button
          onClick={openInviteForm}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Invite Team Member
        </button>
      </div>
      
      {error && (
        <div className="p-4 text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}
      
      {/* Team members list */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">No team members found. Invite your first team member to get started.</div>
        ) : members.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No team members found. Invite your first team member to get started.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        {member.avatar ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={member.avatar}
                            alt={member.name}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      className="px-2 py-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      {roleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      member.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : member.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}>
                      {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(member.joinedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Invite form modal */}
      {isInviteFormOpen && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Invite Team Member
                </h3>
                
                <form onSubmit={handleInvite}>
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="colleague@example.com"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Name (Optional)
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {roleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="mt-2 text-sm text-gray-500">
                      <p><strong>Admin:</strong> Full access to all features including team management</p>
                      <p><strong>Editor:</strong> Can manage services, incidents, and maintenance</p>
                      <p><strong>Viewer:</strong> Can view dashboard but cannot make changes</p>
                    </div>
                  </div>
                  
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
                    >
                      Send Invitation
                    </button>
                    <button
                      type="button"
                      onClick={closeInviteForm}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
