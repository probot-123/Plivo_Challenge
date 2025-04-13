'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { servicesStore, maintenancesStore, initializeStore } from '@/lib/store';

// Maintenance status options
const statusOptions = [
  { value: 'scheduled', label: 'Scheduled', color: 'bg-yellow-500' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' }
];

// Interface definitions
type Service = {
  id: string;
  name: string;
  status: string;
};

type Maintenance = {
  id: string;
  title: string;
  description: string;
  status: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
  services: Service[];
};

export default function MaintenancePage() {
  const params = useParams();
  // Use a default organization ID if not available from URL
  const defaultOrgId = "default-org-id";
  const organizationId = params.organizationId as string || defaultOrgId;
  
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [noOrgWarning, setNoOrgWarning] = useState(false);
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [currentMaintenance, setCurrentMaintenance] = useState<Maintenance | null>(null);
  
  // Form input state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('scheduled');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  
  // Check if organization ID is missing and show warning
  useEffect(() => {
    if (params.organizationId === undefined) {
      setNoOrgWarning(true);
      console.warn("No organization ID found in URL. Using default ID:", defaultOrgId);
    } else {
      setNoOrgWarning(false);
    }
  }, [params.organizationId]);
  
  // Fetch maintenances and services
  useEffect(() => {
    if (!organizationId) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // For development/debugging, use data store if organization ID is the default
        if (organizationId === defaultOrgId) {
          console.log("Using data store for maintenances and services");
          
          // Initialize the store if needed
          initializeStore();
          
          // Load data from localStorage
          setServices(servicesStore.getServices());
          setMaintenances(maintenancesStore.getMaintenances());
          setLoading(false);
          return;
        }
        
        // Fetch maintenances
        const maintenancesResponse = await fetch(`/api/organizations/${organizationId}/maintenances`);
        
        if (!maintenancesResponse.ok) {
          throw new Error('Failed to fetch maintenances');
        }
        
        const maintenancesData = await maintenancesResponse.json();
        setMaintenances(maintenancesData.maintenances);
        
        // Fetch services
        const servicesResponse = await fetch(`/api/organizations/${organizationId}/services`);
        
        if (!servicesResponse.ok) {
          throw new Error('Failed to fetch services');
        }
        
        const servicesData = await servicesResponse.json();
        setServices(servicesData.services);
      } catch (err) {
        setError('Failed to load data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [organizationId]);
  
  // Reset form
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStatus('scheduled');
    setStartTime('');
    setEndTime('');
    setSelectedServices([]);
    setCurrentMaintenance(null);
  };
  
  // Open form for creating a new maintenance
  const openCreateForm = () => {
    resetForm();
    
    // Set default start and end times (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(12, 0, 0, 0);
    
    setStartTime(tomorrow.toISOString().slice(0, 16));
    setEndTime(tomorrowEnd.toISOString().slice(0, 16));
    
    setFormMode('create');
    setIsFormOpen(true);
  };
  
  // Open form for editing a maintenance
  const openEditForm = (maintenance: Maintenance) => {
    setTitle(maintenance.title);
    setDescription(maintenance.description);
    setStatus(maintenance.status);
    setStartTime(new Date(maintenance.startTime).toISOString().slice(0, 16));
    setEndTime(new Date(maintenance.endTime).toISOString().slice(0, 16));
    setSelectedServices(maintenance.services.map(service => service.id));
    setCurrentMaintenance(maintenance);
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
    
    if (!title.trim()) {
      setError('Maintenance title is required');
      return;
    }
    
    if (!startTime || !endTime) {
      setError('Start and end times are required');
      return;
    }
    
    if (new Date(startTime) >= new Date(endTime)) {
      setError('End time must be after start time');
      return;
    }
    
    try {
      setLoading(true);
      
      // Handle data store operations when using default org ID
      if (organizationId === defaultOrgId) {
        console.log(`Data store ${formMode} operation for maintenance`);
        
        if (formMode === 'create') {
          // Create new maintenance
          const newMaintenance: Maintenance = {
            id: `mock-maint-${Date.now()}`,
            title,
            description,
            status,
            startTime: new Date(startTime).toISOString(),
            endTime: new Date(endTime).toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            services: services.filter(service => selectedServices.includes(service.id))
          };
          
          maintenancesStore.addMaintenance(newMaintenance);
          setMaintenances(maintenancesStore.getMaintenances());
        } else if (formMode === 'edit' && currentMaintenance) {
          // Update existing maintenance
          const updatedMaintenance = {
            ...currentMaintenance,
            title,
            description,
            status,
            startTime: new Date(startTime).toISOString(),
            endTime: new Date(endTime).toISOString(),
            updatedAt: new Date().toISOString(),
            services: services.filter(service => selectedServices.includes(service.id))
          };
          
          maintenancesStore.updateMaintenance(currentMaintenance.id, updatedMaintenance);
          setMaintenances(maintenancesStore.getMaintenances());
        }
        
        // Close form
        closeForm();
        setLoading(false);
        return;
      }
      
      const maintenanceData = {
        title,
        description,
        status,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        serviceIds: selectedServices
      };
      
      let response;
      
      if (formMode === 'create') {
        // Create new maintenance
        response = await fetch(`/api/organizations/${organizationId}/maintenances`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(maintenanceData),
        });
      } else {
        // Update existing maintenance
        response = await fetch(`/api/organizations/${organizationId}/maintenances/${currentMaintenance?.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(maintenanceData),
        });
      }
      
      if (!response?.ok) {
        throw new Error(`Failed to ${formMode} maintenance`);
      }
      
      // Refresh maintenances list
      const maintenancesResponse = await fetch(`/api/organizations/${organizationId}/maintenances`);
      const data = await maintenancesResponse.json();
      setMaintenances(data.maintenances);
      
      // Close form
      closeForm();
    } catch (err) {
      setError(`Failed to ${formMode} maintenance. Please try again.`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Update maintenance status
  const handleStatusUpdate = async (maintenanceId: string, newStatus: string) => {
    try {
      setLoading(true);
      
      // Handle data store status update
      if (organizationId === defaultOrgId) {
        console.log(`Data store status update for maintenance ${maintenanceId}: ${newStatus}`);
        
        maintenancesStore.updateMaintenanceStatus(maintenanceId, newStatus);
        setMaintenances(maintenancesStore.getMaintenances());
        
        setLoading(false);
        return;
      }
      
      const response = await fetch(`/api/organizations/${organizationId}/maintenances/${maintenanceId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update maintenance status');
      }
      
      // Refresh maintenances list
      const maintenancesResponse = await fetch(`/api/organizations/${organizationId}/maintenances`);
      const data = await maintenancesResponse.json();
      setMaintenances(data.maintenances);
    } catch (err) {
      setError('Failed to update maintenance status. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle maintenance deletion
  const handleDelete = async (maintenanceId: string) => {
    if (!confirm('Are you sure you want to delete this maintenance?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Handle data store deletion
      if (organizationId === defaultOrgId) {
        console.log("Data store delete operation for maintenance:", maintenanceId);
        maintenancesStore.deleteMaintenance(maintenanceId);
        setMaintenances(maintenancesStore.getMaintenances());
        setLoading(false);
        return;
      }
      
      const response = await fetch(`/api/organizations/${organizationId}/maintenances/${maintenanceId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete maintenance');
      }
      
      // Remove maintenance from state
      setMaintenances(maintenances.filter(maintenance => maintenance.id !== maintenanceId));
    } catch (err) {
      setError('Failed to delete maintenance. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Format date
  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
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
  
  // Check if maintenance can have its status changed to "in_progress"
  const canStartMaintenance = (maintenance: Maintenance) => {
    return maintenance.status === 'scheduled';
  };
  
  // Check if maintenance can have its status changed to "completed"
  const canCompleteMaintenance = (maintenance: Maintenance) => {
    return maintenance.status === 'in_progress';
  };
  
  // Check if maintenance can have its status changed to "cancelled"
  const canCancelMaintenance = (maintenance: Maintenance) => {
    return maintenance.status === 'scheduled' || maintenance.status === 'in_progress';
  };
  
  // Toggle service selection
  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Scheduled Maintenance</h1>
        <button
          onClick={openCreateForm}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Schedule Maintenance
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
      
      {/* Maintenances list */}
      <div className="space-y-4">
        {loading && maintenances.length === 0 ? (
          <div className="p-6 text-center bg-white shadow rounded-lg">Loading maintenances...</div>
        ) : maintenances.length === 0 ? (
          <div className="p-6 text-center bg-white shadow rounded-lg">
            <p className="text-gray-500">No scheduled maintenances found. Schedule your first maintenance to get started.</p>
          </div>
        ) : (
          maintenances.map((maintenance) => (
            <div key={maintenance.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">{maintenance.title}</h2>
                    <div className="flex items-center space-x-2 mb-2">
                      {getStatusBadge(maintenance.status)}
                      <span className="text-sm text-gray-500">
                        {formatDateTime(maintenance.startTime)} - {formatDateTime(maintenance.endTime)}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {canStartMaintenance(maintenance) && (
                      <button
                        onClick={() => handleStatusUpdate(maintenance.id, 'in_progress')}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                      >
                        Start
                      </button>
                    )}
                    {canCompleteMaintenance(maintenance) && (
                      <button
                        onClick={() => handleStatusUpdate(maintenance.id, 'completed')}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                      >
                        Complete
                      </button>
                    )}
                    {canCancelMaintenance(maintenance) && (
                      <button
                        onClick={() => handleStatusUpdate(maintenance.id, 'cancelled')}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={() => openEditForm(maintenance)}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(maintenance.id)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                <div className="mt-2">
                  <p className="text-gray-700">{maintenance.description}</p>
                </div>
                
                {/* Affected services */}
                {maintenance.services.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Affected Services:</h3>
                    <div className="flex flex-wrap gap-2">
                      {maintenance.services.map(service => (
                        <span key={service.id} className="px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded">
                          {service.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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
                  {formMode === 'create' ? 'Schedule Maintenance' : 'Edit Maintenance'}
                </h3>
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Maintenance title"
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
                      placeholder="Describe this maintenance"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time *
                      </label>
                      <input
                        type="datetime-local"
                        id="startTime"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
    <div>
                      <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                        End Time *
                      </label>
                      <input
                        type="datetime-local"
                        id="endTime"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
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
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Affected Services
                    </label>
                    <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-2">
                      {services.length === 0 ? (
                        <p className="text-gray-500 text-sm">No services available</p>
                      ) : (
                        services.map((service) => (
                          <div key={service.id} className="flex items-center mb-2 last:mb-0">
                            <input
                              type="checkbox"
                              id={`service-${service.id}`}
                              checked={selectedServices.includes(service.id)}
                              onChange={() => toggleService(service.id)}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor={`service-${service.id}`} className="ml-2 text-sm text-gray-700">
                              {service.name}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
                    >
                      {formMode === 'create' ? 'Schedule' : 'Update'}
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
