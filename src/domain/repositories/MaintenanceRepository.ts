import { MaintenanceEntity, MaintenanceStatus } from "../entities/Maintenance";

export interface MaintenanceRepository {
  create(maintenance: MaintenanceEntity): Promise<MaintenanceEntity>;
  findById(id: string): Promise<MaintenanceEntity | null>;
  findByOrganizationId(organizationId: string, filter?: MaintenanceFilter): Promise<{ data: MaintenanceEntity[], total: number }>;
  update(maintenance: MaintenanceEntity): Promise<MaintenanceEntity>;
  delete(id: string): Promise<void>;
  
  // Status related operations
  updateStatus(id: string, status: MaintenanceStatus): Promise<MaintenanceEntity>;
  
  // Service Associations
  addServiceToMaintenance(maintenanceId: string, serviceId: string): Promise<void>;
  removeServiceFromMaintenance(maintenanceId: string, serviceId: string): Promise<void>;
  getServicesForMaintenance(maintenanceId: string): Promise<string[]>;
  getMaintenancesForService(serviceId: string, filter?: MaintenanceFilter): Promise<MaintenanceEntity[]>;
}

export interface MaintenanceFilter {
  status?: MaintenanceStatus | 'active'; // 'active' means 'scheduled' or 'in_progress'
  upcoming?: boolean; // If true, only return scheduled maintenances in the future
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
} 