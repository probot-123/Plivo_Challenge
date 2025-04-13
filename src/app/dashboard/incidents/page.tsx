'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { servicesStore, incidentsStore, initializeStore } from '@/lib/store';

// Incident status options
const statusOptions = [
  { value: 'investigating', label: 'Investigating', color: 'bg-yellow-500' },
  { value: 'identified', label: 'Identified', color: 'bg-orange-500' },
  { value: 'monitoring', label: 'Monitoring', color: 'bg-blue-500' },
  { value: 'resolved', label: 'Resolved', color: 'bg-green-500' }
];

// Type definitions
type Service = {
  id: string;
  name: string;
  status: string;
};

type IncidentUpdate = {
  id: string;
  content: string;
  status: string;
  createdAt: string;
};

type Incident = {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  services: Service[];
  updates: IncidentUpdate[];
};

export default function IncidentsPage() {
  const params = useParams();
  // Use a default organization ID if not available from URL
  const defaultOrgId = "default-org-id";
  const organizationId = params.organizationId as string || defaultOrgId;
  
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [noOrgWarning, setNoOrgWarning] = useState(false);
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'update'>('create');
  const [currentIncident, setCurrentIncident] = useState<Incident | null>(null);
  
  // Form input state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('investigating');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [updateContent, setUpdateContent] = useState('');
  
  // Check if organization ID is missing and show warning
  useEffect(() => {
    if (params.organizationId === undefined) {
      setNoOrgWarning(true);
      console.warn("No organization ID found in URL. Using default ID:", defaultOrgId);
    } else {
      setNoOrgWarning(false);
    }
  }, [params.organizationId]);
  
  // Fetch incidents and services
  useEffect(() => {
    if (!organizationId) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // For development/debugging, use data store if organization ID is the default
        if (organizationId === defaultOrgId) {
          console.log("Using data store for incidents and services");
          
          // Initialize the store if needed
          initializeStore();
          
          // Load data from localStorage
          setServices(servicesStore.getServices());
          setIncidents(incidentsStore.getIncidents());
          setLoading(false);
          return;
        }
        
        // Fetch incidents
        const incidentsResponse = await fetch(`/api/organizations/${organizationId}/incidents`);
        
        if (!incidentsResponse.ok) {
          throw new Error('Failed to fetch incidents');
        }
        
        const incidentsData = await incidentsResponse.json();
        setIncidents(incidentsData.incidents);
        
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
    setStatus('investigating');
    setSelectedServices([]);
    setUpdateContent('');
    setCurrentIncident(null);
  };
  
  // Open form for creating a new incident
  const openCreateForm = () => {
    resetForm();
    setFormMode('create');
    setIsFormOpen(true);
  };
  
  // Open form for editing an incident
  const openEditForm = (incident: Incident) => {
    setTitle(incident.title);
    setDescription(incident.description);
    setStatus(incident.status);
    setSelectedServices(incident.services.map(service => service.id));
    setCurrentIncident(incident);
    setFormMode('edit');
    setIsFormOpen(true);
  };
  
  // Open form for adding an update to an incident
  const openUpdateForm = (incident: Incident) => {
    setCurrentIncident(incident);
    setStatus(incident.status);
    setUpdateContent('');
    setFormMode('update');
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
    
    if (formMode === 'update' && !updateContent.trim()) {
      setError('Update content is required');
      return;
    }
    
    if ((formMode === 'create' || formMode === 'edit') && !title.trim()) {
      setError('Incident title is required');
      return;
    }
    
    try {
      setLoading(true);
      
      // Handle data store operations when using default org ID
      if (organizationId === defaultOrgId) {
        console.log(`Data store ${formMode} operation for incident`);
        
        if (formMode === 'create') {
          // Create new incident
          const newIncident: Incident = {
            id: `mock-inc-${Date.now()}`,
            title,
            description,
            status,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            services: services.filter(service => selectedServices.includes(service.id)),
            updates: [
              {
                id: `update-${Date.now()}`,
                content: `Incident created: ${description}`,
                status,
                createdAt: new Date().toISOString()
              }
            ]
          };
          
          incidentsStore.addIncident(newIncident);
          setIncidents(incidentsStore.getIncidents());
        } else if (formMode === 'edit' && currentIncident) {
          // Update existing incident
          const updatedIncident = {
            ...currentIncident,
            title,
            description,
            status,
            updatedAt: new Date().toISOString(),
            services: services.filter(service => selectedServices.includes(service.id))
          };
          
          incidentsStore.updateIncident(currentIncident.id, updatedIncident);
          setIncidents(incidentsStore.getIncidents());
        } else if (formMode === 'update' && currentIncident) {
          // Add update to incident
          const newUpdate = {
            id: `update-${Date.now()}`,
            content: updateContent,
            status,
            createdAt: new Date().toISOString()
          };
          
          incidentsStore.addUpdate(currentIncident.id, newUpdate);
          setIncidents(incidentsStore.getIncidents());
        }
        
        // Close form
        closeForm();
        setLoading(false);
        return;
      }
      
      let response;
      
      if (formMode === 'create') {
        // Create new incident
        response = await fetch(`/api/organizations/${organizationId}/incidents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            description,
            status,
            serviceIds: selectedServices
          }),
        });
      } else if (formMode === 'edit' && currentIncident) {
        // Update existing incident
        response = await fetch(`/api/organizations/${organizationId}/incidents/${currentIncident.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            description,
            status,
            serviceIds: selectedServices
          }),
        });
      } else if (formMode === 'update' && currentIncident) {
        // Add update to incident
        response = await fetch(`/api/organizations/${organizationId}/incidents/${currentIncident.id}/updates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: updateContent,
            status
          }),
        });
      }
      
      if (!response?.ok) {
        throw new Error(`Failed to ${formMode === 'update' ? 'add update to' : formMode} incident`);
      }
      
      // Refresh incidents list
      const incidentsResponse = await fetch(`/api/organizations/${organizationId}/incidents`);
      const data = await incidentsResponse.json();
      setIncidents(data.incidents);
      
      // Close form
      closeForm();
    } catch (err) {
      setError(`Failed to ${formMode === 'update' ? 'add update to' : formMode} incident. Please try again.`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle incident deletion
  const handleDelete = async (incidentId: string) => {
    if (!confirm('Are you sure you want to delete this incident?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Use the data store if using default organization ID
      if (organizationId === defaultOrgId) {
        console.log("Data store delete operation for incident:", incidentId);
        incidentsStore.deleteIncident(incidentId);
        setIncidents(incidentsStore.getIncidents());
        setLoading(false);
        return;
      }
      
      const response = await fetch(`/api/organizations/${organizationId}/incidents/${incidentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete incident');
      }
      
      // Remove incident from state
      setIncidents(incidents.filter(incident => incident.id !== incidentId));
    } catch (err) {
      setError('Failed to delete incident. Please try again.');
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
        <h1 className="text-2xl font-bold">Incidents</h1>
        <button
          onClick={openCreateForm}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Create Incident
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
      
      {/* Incidents list */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Active Incidents</h2>
          <div className="space-y-4">
            {loading && incidents.length === 0 ? (
              <div className="p-6 text-center bg-white shadow rounded-lg">Loading incidents...</div>
            ) : incidents.filter(i => i.status !== 'resolved').length === 0 ? (
              <div className="p-6 text-center bg-white shadow rounded-lg">
                <p className="text-gray-500">No active incidents.</p>
              </div>
            ) : (
              incidents
                .filter(incident => incident.status !== 'resolved')
                .map((incident) => (
                  <div key={incident.id} className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">{incident.title}</h3>
                          <div className="flex items-center space-x-2 mb-2">
                            {getStatusBadge(incident.status)}
                            <span className="text-sm text-gray-500">
                              {formatDateTime(incident.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openUpdateForm(incident)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                          >
                            Add Update
                          </button>
                          <button
                            onClick={() => openEditForm(incident)}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(incident.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <p className="text-gray-700">{incident.description}</p>
                      </div>
                      
                      {/* Affected services */}
                      {incident.services && incident.services.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Affected Services:</h4>
                          <div className="flex flex-wrap gap-2">
                            {incident.services.map(service => (
                              <span key={service.id} className="px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded">
                                {service.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Incident updates */}
                      {incident.updates && incident.updates.length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Updates:</h4>
                          <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                            {incident.updates.map((update, index) => (
                              <div key={update.id} className="relative">
                                <div className="absolute -left-6 mt-1 w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                                <div className="text-sm">
                                  <p className="text-gray-700">{update.content}</p>
                                  <div className="flex items-center mt-1">
                                    {getStatusBadge(update.status)}
                                    <span className="ml-2 text-xs text-gray-500">
                                      {formatDateTime(update.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Resolved Incidents</h2>
          <div className="space-y-4">
            {incidents.filter(i => i.status === 'resolved').length === 0 ? (
              <div className="p-6 text-center bg-white shadow rounded-lg">
                <p className="text-gray-500">No resolved incidents.</p>
              </div>
            ) : (
              incidents
                .filter(incident => incident.status === 'resolved')
                .map((incident) => (
                  <div key={incident.id} className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4">
                      <div className="flex justify-between items-start">
    <div>
                          <h3 className="text-lg font-semibold mb-2">{incident.title}</h3>
                          <div className="flex items-center space-x-2 mb-2">
                            {getStatusBadge(incident.status)}
                            <span className="text-sm text-gray-500">
                              {formatDateTime(incident.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDelete(incident.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <p className="text-gray-700">{incident.description}</p>
                      </div>
                      
                      {/* Affected services */}
                      {incident.services && incident.services.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Affected Services:</h4>
                          <div className="flex flex-wrap gap-2">
                            {incident.services.map(service => (
                              <span key={service.id} className="px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded">
                                {service.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Incident updates */}
                      {incident.updates && incident.updates.length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Updates:</h4>
                          <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                            {incident.updates.map((update, index) => (
                              <div key={update.id} className="relative">
                                <div className="absolute -left-6 mt-1 w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                                <div className="text-sm">
                                  <p className="text-gray-700">{update.content}</p>
                                  <div className="flex items-center mt-1">
                                    {getStatusBadge(update.status)}
                                    <span className="ml-2 text-xs text-gray-500">
                                      {formatDateTime(update.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
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
                  {formMode === 'create' ? 'Create Incident' : formMode === 'edit' ? 'Edit Incident' : 'Add Update'}
                </h3>
                
                <form onSubmit={handleSubmit}>
                  {formMode !== 'update' && (
                    <>
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
                          placeholder="Incident title"
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
                          placeholder="Describe this incident"
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Affected Services
                        </label>
                        <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
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
                    </>
                  )}
                  
                  {formMode === 'update' && (
                    <div className="mb-4">
                      <label htmlFor="updateContent" className="block text-sm font-medium text-gray-700 mb-1">
                        Update *
                      </label>
                      <textarea
                        id="updateContent"
                        value={updateContent}
                        onChange={(e) => setUpdateContent(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Provide an update on this incident"
                        required
                      />
                    </div>
                  )}
                  
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
                      {formMode === 'create' ? 'Create' : formMode === 'edit' ? 'Update' : 'Add Update'}
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
