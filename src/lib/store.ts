// Mock data store for persisting data between dashboard and public pages
// This uses localStorage to persist data between page refreshes

// Default mock data
const defaultServices = [
  { id: 'mock-1', name: 'Website', description: 'Company website', status: 'operational' },
  { id: 'mock-2', name: 'API', description: 'REST API endpoints', status: 'degraded_performance' },
  { id: 'mock-3', name: 'Database', description: 'Main database cluster', status: 'operational' }
];

const createDefaultIncidents = () => {
  const now = new Date();
  return [
    {
      id: 'mock-inc-1',
      title: 'API Latency Issues',
      description: 'Our API endpoints are experiencing increased latency',
      status: 'investigating',
      createdAt: new Date(now.getTime() - 3600000).toISOString(), // 1 hour ago
      updatedAt: new Date(now.getTime() - 1800000).toISOString(), // 30 min ago
      services: [{ id: 'mock-2', name: 'API', status: 'degraded_performance' }],
      updates: [
        {
          id: 'update-1',
          content: 'We are investigating increased latency on API endpoints',
          status: 'investigating',
          createdAt: new Date(now.getTime() - 3600000).toISOString()
        }
      ]
    },
    {
      id: 'mock-inc-2',
      title: 'Database Maintenance Completed',
      description: 'Scheduled database maintenance has been completed',
      status: 'resolved',
      createdAt: new Date(now.getTime() - 86400000).toISOString(), // 1 day ago
      updatedAt: new Date(now.getTime() - 43200000).toISOString(), // 12 hours ago
      services: [{ id: 'mock-3', name: 'Database', status: 'operational' }],
      updates: [
        {
          id: 'update-2-1',
          content: 'Beginning scheduled database maintenance',
          status: 'investigating',
          createdAt: new Date(now.getTime() - 86400000).toISOString()
        },
        {
          id: 'update-2-2',
          content: 'Maintenance in progress, some operations may be slower than usual',
          status: 'identified',
          createdAt: new Date(now.getTime() - 64800000).toISOString() // 18 hours ago
        },
        {
          id: 'update-2-3',
          content: 'Maintenance completed successfully, monitoring performance',
          status: 'monitoring',
          createdAt: new Date(now.getTime() - 54000000).toISOString() // 15 hours ago
        },
        {
          id: 'update-2-4',
          content: 'All systems operating normally',
          status: 'resolved',
          createdAt: new Date(now.getTime() - 43200000).toISOString() // 12 hours ago
        }
      ]
    }
  ];
};

const createDefaultMaintenances = () => {
  const now = new Date();
  return [
    {
      id: 'mock-maint-1',
      title: 'Database Upgrade',
      description: 'Scheduled database upgrade to improve performance',
      status: 'scheduled',
      startTime: new Date(now.getTime() + 86400000).toISOString(), // Tomorrow
      endTime: new Date(now.getTime() + 93600000).toISOString(), // Tomorrow + 2 hours
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      services: [{ id: 'mock-3', name: 'Database', status: 'operational' }]
    },
    {
      id: 'mock-maint-2',
      title: 'API Maintenance',
      description: 'Regular maintenance of API services',
      status: 'completed',
      startTime: new Date(now.getTime() - 172800000).toISOString(), // 2 days ago
      endTime: new Date(now.getTime() - 169200000).toISOString(), // 2 days ago + 1 hour
      createdAt: new Date(now.getTime() - 259200000).toISOString(), // 3 days ago
      updatedAt: new Date(now.getTime() - 169200000).toISOString(), // 2 days ago + 1 hour
      services: [{ id: 'mock-2', name: 'API', status: 'degraded_performance' }]
    }
  ];
};

// Helper functions for localStorage
const getFromStorage = (key: string, defaultValue: any) => {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error getting item ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const setToStorage = (key: string, value: any) => {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting item ${key} in localStorage:`, error);
  }
};

// Services data store
export const servicesStore = {
  getServices: () => getFromStorage('mockServices', defaultServices),
  setServices: (services: any[]) => setToStorage('mockServices', services),
  resetServices: () => setToStorage('mockServices', defaultServices),
  
  addService: (service: any) => {
    const services = servicesStore.getServices();
    servicesStore.setServices([...services, service]);
  },
  
  updateService: (id: string, updatedService: any) => {
    const services = servicesStore.getServices();
    servicesStore.setServices(
      services.map(service => service.id === id ? { ...service, ...updatedService } : service)
    );
  },
  
  deleteService: (id: string) => {
    const services = servicesStore.getServices();
    servicesStore.setServices(services.filter(service => service.id !== id));
  }
};

// Incidents data store
export const incidentsStore = {
  getIncidents: () => getFromStorage('mockIncidents', createDefaultIncidents()),
  setIncidents: (incidents: any[]) => setToStorage('mockIncidents', incidents),
  resetIncidents: () => setToStorage('mockIncidents', createDefaultIncidents()),
  
  addIncident: (incident: any) => {
    const incidents = incidentsStore.getIncidents();
    incidentsStore.setIncidents([incident, ...incidents]);
  },
  
  updateIncident: (id: string, updatedIncident: any) => {
    const incidents = incidentsStore.getIncidents();
    incidentsStore.setIncidents(
      incidents.map(incident => incident.id === id ? { ...incident, ...updatedIncident } : incident)
    );
  },
  
  deleteIncident: (id: string) => {
    const incidents = incidentsStore.getIncidents();
    incidentsStore.setIncidents(incidents.filter(incident => incident.id !== id));
  },
  
  addUpdate: (incidentId: string, update: any) => {
    const incidents = incidentsStore.getIncidents();
    incidentsStore.setIncidents(
      incidents.map(incident => {
        if (incident.id === incidentId) {
          return {
            ...incident,
            status: update.status || incident.status,
            updatedAt: new Date().toISOString(),
            updates: [...(incident.updates || []), update]
          };
        }
        return incident;
      })
    );
  }
};

// Maintenances data store
export const maintenancesStore = {
  getMaintenances: () => getFromStorage('mockMaintenances', createDefaultMaintenances()),
  setMaintenances: (maintenances: any[]) => setToStorage('mockMaintenances', maintenances),
  resetMaintenances: () => setToStorage('mockMaintenances', createDefaultMaintenances()),
  
  addMaintenance: (maintenance: any) => {
    const maintenances = maintenancesStore.getMaintenances();
    maintenancesStore.setMaintenances([maintenance, ...maintenances]);
  },
  
  updateMaintenance: (id: string, updatedMaintenance: any) => {
    const maintenances = maintenancesStore.getMaintenances();
    maintenancesStore.setMaintenances(
      maintenances.map(maintenance => maintenance.id === id ? { ...maintenance, ...updatedMaintenance } : maintenance)
    );
  },
  
  deleteMaintenance: (id: string) => {
    const maintenances = maintenancesStore.getMaintenances();
    maintenancesStore.setMaintenances(maintenances.filter(maintenance => maintenance.id !== id));
  },
  
  updateMaintenanceStatus: (id: string, status: string) => {
    const maintenances = maintenancesStore.getMaintenances();
    maintenancesStore.setMaintenances(
      maintenances.map(maintenance => {
        if (maintenance.id === id) {
          return {
            ...maintenance,
            status,
            updatedAt: new Date().toISOString()
          };
        }
        return maintenance;
      })
    );
  }
};

// Initialize localStorage with default values if not already set
export const initializeStore = () => {
  if (typeof window === 'undefined') {
    return;
  }
  
  const services = window.localStorage.getItem('mockServices');
  if (!services) {
    servicesStore.resetServices();
  }
  
  const incidents = window.localStorage.getItem('mockIncidents');
  if (!incidents) {
    incidentsStore.resetIncidents();
  }
  
  const maintenances = window.localStorage.getItem('mockMaintenances');
  if (!maintenances) {
    maintenancesStore.resetMaintenances();
  }
}; 