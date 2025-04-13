'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { servicesStore, initializeStore } from '@/lib/store';

// Service status options
const statusOptions = [
  { value: 'operational', label: 'Operational', color: 'bg-green-500' },
  { value: 'degraded_performance', label: 'Degraded Performance', color: 'bg-yellow-500' },
  { value: 'partial_outage', label: 'Partial Outage', color: 'bg-orange-500' },
  { value: 'major_outage', label: 'Major Outage', color: 'bg-red-500' }
];

// Service type definition
type Service = {
  id: string;
  name: string;
  description: string;
  status: string;
};

export default function ServicesPage() {
  const params = useParams();
  // Use a default organization ID if not available from URL
  const defaultOrgId = "default-org-id";
  const organizationId = params.organizationId as string || defaultOrgId;
  
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [noOrgWarning, setNoOrgWarning] = useState(false);
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [currentService, setCurrentService] = useState<Service | null>(null);
  
  // Form input state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('operational');
  
  // Check if organization ID is missing and show warning
  useEffect(() => {
    if (params.organizationId === undefined) {
      setNoOrgWarning(true);
      console.warn("No organization ID found in URL. Using default ID:", defaultOrgId);
    } else {
      setNoOrgWarning(false);
    }
  }, [params.organizationId]);
  
  // Fetch services
  useEffect(() => {
    if (!organizationId) return;
    
    const fetchServices = async () => {
      try {
        setLoading(true);
        
        // For development/debugging, use the data store services
        if (organizationId === defaultOrgId) {
          console.log("Using data store for services");
          // Initialize the store if needed
          initializeStore();
          
          // Load services from localStorage
          setServices(servicesStore.getServices());
          setLoading(false);
          return;
        }
        
        const response = await fetch(`/api/organizations/${organizationId}/services`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch services');
        }
        
        const data = await response.json();
        setServices(data.services);
      } catch (err) {
        setError('Failed to load services. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchServices();
  }, [organizationId]);
  
  // Reset form
  const resetForm = () => {
    setName('');
    setDescription('');
    setStatus('operational');
    setCurrentService(null);
  };
  
  // Open form for creating a new service
  const openCreateForm = () => {
    resetForm();
    setFormMode('create');
    setIsFormOpen(true);
  };
  
  // Open form for editing a service
  const openEditForm = (service: Service) => {
    setName(service.name);
    setDescription(service.description);
    setStatus(service.status);
    setCurrentService(service);
    setFormMode('edit');
    setIsFormOpen(true);
  };
  
  // Close form
  const closeForm = () => {
    setIsFormOpen(false);
    resetForm();
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Service name is required');
      return;
    }
    
    try {
      setLoading(true);
      
      const serviceData = {
        name,
        description,
        status
      };
      
      // Use the data store operations if using default organization ID
      if (organizationId === defaultOrgId) {
        console.log(`Data store ${formMode} operation for service:`, serviceData);
        
        if (formMode === 'create') {
          const newService: Service = {
            id: `mock-${Date.now()}`,
            ...serviceData
          };
          servicesStore.addService(newService);
          setServices(servicesStore.getServices());
        } else if (formMode === 'edit' && currentService) {
          servicesStore.updateService(currentService.id, serviceData);
          setServices(servicesStore.getServices());
        }
        
        // Close form
        closeForm();
        setLoading(false);
        return;
      }
      
      let response;
      
      if (formMode === 'create') {
        // Create new service
        response = await fetch(`/api/organizations/${organizationId}/services`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(serviceData),
        });
      } else {
        // Update existing service
        response = await fetch(`/api/organizations/${organizationId}/services/${currentService?.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(serviceData),
        });
      }
      
      if (!response.ok) {
        throw new Error(`Failed to ${formMode} service`);
      }
      
      // Refresh services list
      const servicesResponse = await fetch(`/api/organizations/${organizationId}/services`);
      const data = await servicesResponse.json();
      setServices(data.services);
      
      // Close form
      closeForm();
    } catch (err) {
      setError(`Failed to ${formMode} service. Please try again.`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle service deletion
  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Use data store delete if using default organization ID
      if (organizationId === defaultOrgId) {
        console.log("Data store delete operation for service:", serviceId);
        servicesStore.deleteService(serviceId);
        setServices(servicesStore.getServices());
        setLoading(false);
        return;
      }
      
      const response = await fetch(`/api/organizations/${organizationId}/services/${serviceId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete service');
      }
      
      // Remove service from state
      setServices(services.filter(service => service.id !== serviceId));
    } catch (err) {
      setError('Failed to delete service. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusOption?.color || 'bg-gray-500'} text-white`}>
        {statusOption?.label || 'Unknown'}
      </span>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Services</h1>
        <button
          onClick={openCreateForm}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add Service
        </button>
      </div>
      
      {noOrgWarning && (
        <div className="p-4 text-amber-700 bg-amber-100 rounded-md">
          <p className="font-medium">No organization selected.</p>
          <p className="text-sm">Please select an organization from settings or create one. Using demo mode for now.</p>
        </div>
      )}
      
      {error && (
        <div className="p-4 text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}
      
      {/* Services list */}
      <div className="space-y-4">
        {loading && services.length === 0 ? (
          <div className="p-6 text-center bg-white shadow rounded-lg">Loading services...</div>
        ) : services.length === 0 ? (
          <div className="p-6 text-center bg-white shadow rounded-lg">
            <p className="text-gray-500">No services found. Add your first service to get started.</p>
          </div>
        ) : (
          services.map((service) => (
            <div key={service.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4">
                <div className="flex justify-between items-start">
    <div>
                    <h2 className="text-xl font-semibold mb-2">{service.name}</h2>
                    <div className="flex items-center space-x-2 mb-2">
                      {getStatusBadge(service.status)}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditForm(service)}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                <div className="mt-2">
                  <p className="text-gray-700">{service.description}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Form modal */}
      {isFormOpen && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  {formMode === 'create' ? 'Add Service' : 'Edit Service'}
                </h3>
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Service name"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe this service"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      id="status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
                    >
                      {formMode === 'create' ? 'Add' : 'Update'}
                    </button>
                    <button
                      type="button"
                      onClick={closeForm}
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
