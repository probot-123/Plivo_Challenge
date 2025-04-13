import { IncidentEntity, IncidentStatus } from "../entities/Incident";
import { IncidentUpdateEntity } from "../entities/IncidentUpdate";

export interface IncidentRepository {
  create(incident: IncidentEntity): Promise<IncidentEntity>;
  findById(id: string): Promise<IncidentEntity | null>;
  findByOrganizationId(organizationId: string, filter?: IncidentFilter): Promise<{ data: IncidentEntity[], total: number }>;
  update(incident: IncidentEntity): Promise<IncidentEntity>;
  delete(id: string): Promise<void>;
  
  // Status related operations
  updateStatus(id: string, status: IncidentStatus, updateMessage?: string, userId?: string): Promise<IncidentEntity>;
  
  // Incident Updates
  addUpdate(incidentUpdate: IncidentUpdateEntity): Promise<IncidentUpdateEntity>;
  getUpdates(incidentId: string): Promise<IncidentUpdateEntity[]>;
  
  // Service Associations
  addServiceToIncident(incidentId: string, serviceId: string): Promise<void>;
  removeServiceFromIncident(incidentId: string, serviceId: string): Promise<void>;
  getServicesForIncident(incidentId: string): Promise<string[]>;
  getIncidentsForService(serviceId: string, filter?: IncidentFilter): Promise<IncidentEntity[]>;
}

export interface IncidentFilter {
  status?: IncidentStatus | 'active'; // 'active' means any status except 'resolved'
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
} 