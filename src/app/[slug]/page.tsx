"use client";

import { useState, useEffect } from "react";
import { useParams } from 'next/navigation';
import { format } from 'date-fns';

// Component for displaying service status
const ServiceStatusCard = ({ service }) => {
  const statusColors = {
    operational: "bg-green-500",
    degraded: "bg-yellow-500",
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
  return (
    <div className="mb-4 rounded-lg bg-white shadow p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{incident.title}</h3>
        <div className={`bg-${incident.status === 'resolved' ? 'green' : 'orange'}-500 text-white rounded-full px-3 py-1 text-sm`}>
          {incident.status.toUpperCase()}
        </div>
      </div>
      <p className="text-gray-600 mt-2">{incident.description}</p>
      <div className="text-sm text-gray-500 mt-2">
        {format(new Date(incident.createdAt), 'MMM d, yyyy HH:mm')}
      </div>
    </div>
  );
};

// Component for displaying maintenance windows
const MaintenanceCard = ({ maintenance }) => {
  return (
    <div className="mb-4 rounded-lg bg-white shadow p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{maintenance.title}</h3>
        <div className={`bg-blue-500 text-white rounded-full px-3 py-1 text-sm`}>
          {maintenance.status.toUpperCase().replace('_', ' ')}
        </div>
      </div>
      <p className="text-gray-600 mt-2">{maintenance.description}</p>
      <div className="flex justify-between text-sm text-gray-500 mt-2">
        <div>
          <span className="font-medium">Start:</span> {format(new Date(maintenance.scheduledStartTime), 'MMM d, yyyy HH:mm')}
        </div>
        <div>
          <span className="font-medium">End:</span> {format(new Date(maintenance.scheduledEndTime), 'MMM d, yyyy HH:mm')}
        </div>
      </div>
    </div>
  );
};

export default function OrganizationStatusPage() {
  const { slug } = useParams();
  const [organization, setOrganization] = useState(null);
  const [services, setServices] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [maintenances, setMaintenances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Function to fetch organization data
    const fetchOrganizationData = async () => {
      try {
        // Fetch organization details
        const orgResponse = await fetch(`/api/public/organizations/${slug}`);
        if (!orgResponse.ok) throw new Error('Failed to fetch organization');
        const orgData = await orgResponse.json();
        setOrganization(orgData);

        // Fetch services 
        const servicesResponse = await fetch(`/api/public/organizations/${slug}/services`);
        if (!servicesResponse.ok) throw new Error('Failed to fetch services');
        const servicesData = await servicesResponse.json();
        setServices(servicesData.services || []);

        // Fetch incidents
        try {
          const incidentsResponse = await fetch(`/api/public/organizations/${slug}/incidents`);
          if (incidentsResponse.ok) {
            const incidentsData = await incidentsResponse.json();
            setIncidents(incidentsData.incidents || []);
          }
        } catch (e) {
          console.error('Error fetching incidents:', e);
        }

        // Fetch maintenances
        try {
          const maintenancesResponse = await fetch(`/api/public/organizations/${slug}/maintenances`);
          if (maintenancesResponse.ok) {
            const maintenancesData = await maintenancesResponse.json();
            setMaintenances(maintenancesData.maintenances || []);
          }
        } catch (e) {
          console.error('Error fetching maintenances:', e);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (slug) {
      fetchOrganizationData();
    }
  }, [slug]);

  // Calculate overall system status based on individual service statuses
  const calculateOverallStatus = () => {
    if (!services || services.length === 0) return { status: "unknown", text: "Unknown" };
    
    if (services.some(service => service.status === 'major_outage')) {
      return { status: "major_outage", text: "Major System Outage", color: "bg-red-500" };
    } else if (services.some(service => service.status === 'partial_outage')) {
      return { status: "partial_outage", text: "Partial System Outage", color: "bg-orange-500" };
    } else if (services.some(service => service.status === 'degraded')) {
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

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error: {error}</p>
          <p>Please try again later or contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
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
        {maintenances.filter(m => m.status !== 'completed').length > 0 ? (
          maintenances
            .filter(m => m.status !== 'completed')
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

      <footer className="text-center text-gray-500 text-sm mt-12 pt-4 border-t">
        <p>© {new Date().getFullYear()} {organization?.name || 'Organization'} Status Page</p>
        <p className="mt-1">Powered by Status Page Application</p>
      </footer>
    </div>
  );
} 