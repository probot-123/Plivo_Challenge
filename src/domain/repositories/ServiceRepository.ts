import { ServiceEntity, ServiceStatus, StatusChange } from "../entities/Service";

export interface ServiceRepository {
  create(service: ServiceEntity): Promise<ServiceEntity>;
  findById(id: string): Promise<ServiceEntity | null>;
  findByOrganizationId(organizationId: string, page?: number, limit?: number): Promise<{ data: ServiceEntity[], total: number }>;
  update(service: ServiceEntity): Promise<ServiceEntity>;
  delete(id: string): Promise<void>;
  
  // Status related operations
  updateStatus(id: string, status: ServiceStatus): Promise<ServiceEntity>;
  addStatusHistory(statusChange: StatusChange): Promise<StatusChange>;
  getStatusHistory(serviceId: string, page?: number, limit?: number): Promise<{ data: StatusChange[], total: number }>;
  
  // Public status page
  getPublicServices(organizationId: string): Promise<ServiceEntity[]>;
  getServicesByIds(ids: string[]): Promise<ServiceEntity[]>;
  
  // Maintenance associations
  findByMaintenanceId(maintenanceId: string): Promise<ServiceEntity[]>;
} 