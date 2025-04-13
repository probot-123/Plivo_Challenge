import { db } from "../db/connection";
import { services, statusHistory, serviceMaintenances } from "../db/schema";
import { ServiceRepository } from "@/domain/repositories/ServiceRepository";
import { ServiceEntity, ServiceStatus, StatusChange } from "@/domain/entities/Service";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { emitToOrganization, SocketEventType } from '@/lib/socketServer';

export class ServiceRepositoryImpl implements ServiceRepository {
  async create(service: ServiceEntity): Promise<ServiceEntity> {
    const created = await db.insert(services)
      .values({
        id: service.id,
        name: service.name,
        description: service.description,
        status: service.status,
        organizationId: service.organizationId,
        isPublic: service.isPublic,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
      })
      .returning();

    // Create initial status history entry
    await this.addStatusHistory(service.createStatusChange());

    return new ServiceEntity(created[0]);
  }

  async findById(id: string): Promise<ServiceEntity | null> {
    const result = await db.select()
      .from(services)
      .where(eq(services.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return new ServiceEntity(result[0]);
  }

  async findByOrganizationId(organizationId: string, page: number = 1, limit: number = 10): Promise<{ data: ServiceEntity[]; total: number }> {
    const offset = (page - 1) * limit;

    const data = await db.select()
      .from(services)
      .where(eq(services.organizationId, organizationId))
      .limit(limit)
      .offset(offset)
      .orderBy(services.createdAt);

    const [{ count }] = await db.select({
      count: sql<number>`count(*)`
    })
    .from(services)
    .where(eq(services.organizationId, organizationId));

    return {
      data: data.map(service => new ServiceEntity(service)),
      total: count,
    };
  }

  async update(service: ServiceEntity): Promise<ServiceEntity> {
    const updated = await db.update(services)
      .set({
        name: service.name,
        description: service.description,
        status: service.status,
        isPublic: service.isPublic,
        updatedAt: service.updatedAt,
      })
      .where(eq(services.id, service.id))
      .returning();

    return new ServiceEntity(updated[0]);
  }

  async delete(id: string): Promise<void> {
    await db.delete(services)
      .where(eq(services.id, id));
  }

  async updateStatus(id: string, status: ServiceStatus): Promise<ServiceEntity> {
    const service = await this.findById(id);
    
    if (!service) {
      throw new Error(`Service with ID ${id} not found`);
    }
    
    // Only update if status is different
    if (service.status !== status) {
      service.updateStatus(status);
      
      const updated = await db.update(services)
        .set({ 
          status: service.status,
          updatedAt: service.updatedAt,
        })
        .where(eq(services.id, id))
        .returning();

      // Add status history entry
      await this.addStatusHistory(service.createStatusChange());

      // Emit WebSocket event for service status change
      emitToOrganization(
        service.organizationId,
        SocketEventType.SERVICE_STATUS_CHANGE,
        {
          serviceId: service.id,
          status: service.status,
          name: service.name,
          updatedAt: service.updatedAt
        }
      );

      return new ServiceEntity(updated[0]);
    }
    
    return service;
  }

  async addStatusHistory(statusChange: StatusChange): Promise<StatusChange> {
    const created = await db.insert(statusHistory)
      .values({
        id: statusChange.id || crypto.randomUUID(),
        serviceId: statusChange.serviceId,
        status: statusChange.status,
        createdAt: statusChange.createdAt,
      })
      .returning();

    return created[0];
  }

  async getStatusHistory(serviceId: string, page: number = 1, limit: number = 10): Promise<{ data: StatusChange[]; total: number }> {
    const offset = (page - 1) * limit;

    const data = await db.select()
      .from(statusHistory)
      .where(eq(statusHistory.serviceId, serviceId))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(statusHistory.createdAt));

    const [{ count }] = await db.select({
      count: sql<number>`count(*)`
    })
    .from(statusHistory)
    .where(eq(statusHistory.serviceId, serviceId));

    return {
      data,
      total: count,
    };
  }

  async getPublicServices(organizationId: string): Promise<ServiceEntity[]> {
    const data = await db.select()
      .from(services)
      .where(
        and(
          eq(services.organizationId, organizationId),
          eq(services.isPublic, true)
        )
      )
      .orderBy(services.name);

    return data.map(service => new ServiceEntity(service));
  }

  async getServicesByIds(ids: string[]): Promise<ServiceEntity[]> {
    if (ids.length === 0) {
      return [];
    }

    const data = await db.select()
      .from(services)
      .where(inArray(services.id, ids))
      .orderBy(services.name);

    return data.map(service => new ServiceEntity(service));
  }
  
  async findByMaintenanceId(maintenanceId: string): Promise<ServiceEntity[]> {
    // Find all service IDs associated with this maintenance
    const serviceAssociations = await db.select({ serviceId: serviceMaintenances.serviceId })
      .from(serviceMaintenances)
      .where(eq(serviceMaintenances.maintenanceId, maintenanceId));
    
    if (serviceAssociations.length === 0) {
      return [];
    }
    
    // Extract the service IDs
    const serviceIds = serviceAssociations.map(association => association.serviceId);
    
    // Fetch the actual service entities
    const serviceData = await db.select()
      .from(services)
      .where(inArray(services.id, serviceIds))
      .orderBy(services.name);
    
    return serviceData.map(service => new ServiceEntity(service));
  }
} 