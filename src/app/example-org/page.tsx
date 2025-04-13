"use client";

import { useState, useEffect } from "react";
import { format } from 'date-fns';
import { servicesStore, incidentsStore, maintenancesStore, initializeStore } from "@/lib/store";

// Component for displaying service status
const ServiceStatusCard = ({ service }) => {
  const statusColors = {
    operational: "bg-green-500",
    degraded_performance: "bg-yellow-500",
    partial_outage: "bg-orange-500",
    major_outage: "bg-red-500"
  };

  return (
    <div className="mb-4 rounded-lg bg-white shadow p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{service.name}</h3>
        <div className={`${statusColors[service.status]} text-white rounded-full px-3 py-1 text-sm`}>
          {service.status.replace('_', ' ').toUpperCase()}
        </div>
      </div>
      <p className="text-gray-600 mt-2">{service.description}</p>
    </div>
  );
};

// Component for displaying incidents
const IncidentCard = ({ incident }) => {
  const statusColors = {
    investigating: "bg-yellow-500",
    identified: "bg-orange-500",
    monitoring: "bg-blue-500",
    resolved: "bg-green-500"
  };

  return (
    <div className="mb-4 rounded-lg bg-white shadow p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{incident.title}</h3>
        <div className={`${statusColors[incident.status]} text-white rounded-full px-3 py-1 text-sm`}>
          {incident.status.toUpperCase()}
        </div>
      </div>
      <p className="text-gray-600 mt-2">{incident.description}</p>
      <div className="text-sm text-gray-500 mt-2">
        {format(new Date(incident.createdAt), 'MMM d, yyyy HH:mm')}
      </div>
      
      {/* Incident updates */}
      {incident.updates && incident.updates.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Updates</h4>
          <div className="timeline">
            {incident.updates.map((update, index) => (
              <div key={update.id} className="timeline-item">
                <div className="ml-4">
                  <p className="text-sm">{update.content}</p>
                  <div className="flex items-center mt-1">
                    <span className={`inline-block h-2 w-2 rounded-full ${statusColors[update.status]}`}></span>
                    <span className="text-xs text-gray-500 ml-2">
                      {format(new Date(update.createdAt), 'MMM d, yyyy HH:mm')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Affected services */}
      {incident.services && incident.services.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Affected Services</h4>
          <div className="flex flex-wrap gap-2">
            {incident.services.map(service => (
              <span key={service.id} className="px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded">
                {service.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Component for displaying maintenance windows
const MaintenanceCard = ({ maintenance }) => {
  const statusColors = {
    scheduled: "bg-yellow-500",
    in_progress: "bg-blue-500",
    completed: "bg-green-500",
    cancelled: "bg-red-500"
  };

  return (
    <div className="mb-4 rounded-lg bg-white shadow p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{maintenance.title}</h3>
        <div className={`${statusColors[maintenance.status]} text-white rounded-full px-3 py-1 text-sm`}>
          {maintenance.status.toUpperCase().replace('_', ' ')}
        </div>
      </div>
      <p className="text-gray-600 mt-2">{maintenance.description}</p>
      <div className="flex justify-between text-sm text-gray-500 mt-2">
        <div>
          <span className="font-medium">Start:</span> {format(new Date(maintenance.startTime), 'MMM d, yyyy HH:mm')}
        </div>
        <div>
          <span className="font-medium">End:</span> {format(new Date(maintenance.endTime), 'MMM d, yyyy HH:mm')}
        </div>
      </div>
      
      {/* Affected services */}
      {maintenance.services && maintenance.services.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Affected Services</h4>
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
  );
};

export default function ExampleOrgStatusPage() {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [maintenances, setMaintenances] = useState([]);
  const [organization, setOrganization] = useState({
    name: "Example Organization",
    logoUrl: null,
    description: "This is an example organization with mock data"
  });

  // Initialize the data store if needed and load data
  useEffect(() => {
    const loadData = () => {
      try {
        // Initialize the store if needed
        initializeStore();
        
        // Load data from localStorage
        setServices(servicesStore.getServices());
        setIncidents(incidentsStore.getIncidents());
        setMaintenances(maintenancesStore.getMaintenances());
        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };
    
    loadData();
    
    // Set up event listeners for localStorage changes from other tabs/windows
    const handleStorageChange = (e) => {
      if (e.key === 'mockServices') {
        setServices(JSON.parse(e.newValue || '[]'));
      } else if (e.key === 'mockIncidents') {
        setIncidents(JSON.parse(e.newValue || '[]'));
      } else if (e.key === 'mockMaintenances') {
        setMaintenances(JSON.parse(e.newValue || '[]'));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Polling for changes (for changes within the same tab)
    const interval = setInterval(() => {
      setServices(servicesStore.getServices());
      setIncidents(incidentsStore.getIncidents());
      setMaintenances(maintenancesStore.getMaintenances());
    }, 5000); // Check every 5 seconds
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);
  
  // Calculate overall system status based on individual service statuses
  const calculateOverallStatus = () => {
    if (!services || services.length === 0) return { status: "unknown", text: "Unknown", color: "bg-gray-500" };
    
    if (services.some(service => service.status === 'major_outage')) {
      return { status: "major_outage", text: "Major System Outage", color: "bg-red-500" };
    } else if (services.some(service => service.status === 'partial_outage')) {
      return { status: "partial_outage", text: "Partial System Outage", color: "bg-orange-500" };
    } else if (services.some(service => service.status === 'degraded_performance')) {
      return { status: "degraded", text: "System Performance Degraded", color: "bg-yellow-500" };
    } else {
      return { status: "operational", text: "All Systems Operational", color: "bg-green-500" };
    }
  };

  const overallStatus = calculateOverallStatus();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Controls for testing/debugging */}
      <div className="mb-4 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-sm font-medium mb-2">Demo Controls</h3>
        <div className="flex space-x-2">
          <button 
            onClick={() => {
              servicesStore.resetServices();
              incidentsStore.resetIncidents();
              maintenancesStore.resetMaintenances();
              setServices(servicesStore.getServices());
              setIncidents(incidentsStore.getIncidents());
              setMaintenances(maintenancesStore.getMaintenances());
            }}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Reset to Default Data
          </button>
        </div>
      </div>

      {/* Header with organization details */}
      <div className="mb-8 text-center">
        {organization?.logoUrl && (
          <img 
            src={organization.logoUrl} 
            alt={`${organization?.name || 'Organization'} logo`} 
            className="h-16 mx-auto mb-4"
          />
        )}
        <h1 className="text-3xl font-bold mb-2">{organization?.name || 'Organization'} Status</h1>
        <div className={`inline-block ${overallStatus.color} text-white rounded-full px-4 py-2 text-lg font-medium`}>
          {overallStatus.text}
        </div>
        <p className="text-gray-600 mt-4">Current status as of {format(new Date(), 'MMM d, yyyy HH:mm')}</p>
      </div>

      {/* Services Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4 pb-2 border-b">Services</h2>
        {services.length > 0 ? (
          services.map(service => (
            <ServiceStatusCard key={service.id} service={service} />
          ))
        ) : (
          <p className="text-gray-600">No services available</p>
        )}
      </div>

      {/* Active Incidents Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4 pb-2 border-b">Active Incidents</h2>
        {incidents.filter(i => i.status !== 'resolved').length > 0 ? (
          incidents
            .filter(i => i.status !== 'resolved')
            .map(incident => (
              <IncidentCard key={incident.id} incident={incident} />
            ))
        ) : (
          <p className="text-gray-600">No active incidents</p>
        )}
      </div>

      {/* Scheduled Maintenance Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4 pb-2 border-b">Scheduled Maintenance</h2>
        {maintenances.filter(m => m.status === 'scheduled' || m.status === 'in_progress').length > 0 ? (
          maintenances
            .filter(m => m.status === 'scheduled' || m.status === 'in_progress')
            .map(maintenance => (
              <MaintenanceCard key={maintenance.id} maintenance={maintenance} />
            ))
        ) : (
          <p className="text-gray-600">No scheduled maintenance</p>
        )}
      </div>

      {/* Past Incidents Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4 pb-2 border-b">Past Incidents</h2>
        {incidents.filter(i => i.status === 'resolved').length > 0 ? (
          incidents
            .filter(i => i.status === 'resolved')
            .map(incident => (
              <IncidentCard key={incident.id} incident={incident} />
            ))
        ) : (
          <p className="text-gray-600">No past incidents</p>
        )}
      </div>

      {/* Past Maintenance Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4 pb-2 border-b">Past Maintenance</h2>
        {maintenances.filter(m => m.status === 'completed' || m.status === 'cancelled').length > 0 ? (
          maintenances
            .filter(m => m.status === 'completed' || m.status === 'cancelled')
            .map(maintenance => (
              <MaintenanceCard key={maintenance.id} maintenance={maintenance} />
            ))
        ) : (
          <p className="text-gray-600">No past maintenance</p>
        )}
      </div>

      <footer className="text-center text-gray-500 text-sm mt-12 pt-4 border-t">
        <p>© {new Date().getFullYear()} {organization?.name || 'Organization'} Status Page</p>
        <p className="mt-1">Powered by Status Page Application</p>
      </footer>
    </div>
  );
} 