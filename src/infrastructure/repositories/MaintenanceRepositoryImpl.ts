import { db } from "../db/connection";
import { maintenances, serviceMaintenances } from "../db/schema";
import { MaintenanceRepository, MaintenanceFilter } from "@/domain/repositories/MaintenanceRepository";
import { MaintenanceEntity, MaintenanceStatus } from "@/domain/entities/Maintenance";
import { eq, and, or, desc, sql, lt, gte, lte, isNull } from "drizzle-orm";
// Import emitToOrganization directly from the TypeScript implementation
import { emitToOrganization, SocketEventType } from '@/lib/socketServer';

export class MaintenanceRepositoryImpl implements MaintenanceRepository {
  async create(maintenance: MaintenanceEntity): Promise<MaintenanceEntity> {
    const created = await db.insert(maintenances)
      .values({
        id: maintenance.id,
        title: maintenance.title,
        description: maintenance.description,
        status: maintenance.status,
        organizationId: maintenance.organizationId,
        createdById: maintenance.createdById,
        scheduledStartTime: maintenance.scheduledStartTime,
        scheduledEndTime: maintenance.scheduledEndTime,
        actualStartTime: maintenance.actualStartTime,
        actualEndTime: maintenance.actualEndTime,
        createdAt: maintenance.createdAt,
        updatedAt: maintenance.updatedAt,
      })
      .returning();

    const createdMaintenance = new MaintenanceEntity(created[0]);

    // Emit WebSocket event for maintenance creation
    emitToOrganization(
      createdMaintenance.organizationId,
      SocketEventType.MAINTENANCE_CREATE,
      {
        maintenanceId: createdMaintenance.id,
        title: createdMaintenance.title,
        status: createdMaintenance.status,
        scheduledStartTime: createdMaintenance.scheduledStartTime,
        scheduledEndTime: createdMaintenance.scheduledEndTime,
        createdAt: createdMaintenance.createdAt
      }
    );

    return createdMaintenance;
  }

  async findById(id: string): Promise<MaintenanceEntity | null> {
    const result = await db.select()
      .from(maintenances)
      .where(eq(maintenances.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return new MaintenanceEntity(result[0]);
  }

  async findByOrganizationId(organizationId: string, filter?: MaintenanceFilter): Promise<{ data: MaintenanceEntity[]; total: number }> {
    const page = filter?.page || 1;
    const limit = filter?.limit || 10;
    const offset = (page - 1) * limit;

    let query = db.select()
      .from(maintenances)
      .where(eq(maintenances.organizationId, organizationId));

    // Apply additional filters
    if (filter) {
      if (filter.status === 'active') {
        query = query.where(or(
          eq(maintenances.status, 'scheduled'),
          eq(maintenances.status, 'in_progress')
        ));
      } else if (filter.status) {
        query = query.where(eq(maintenances.status, filter.status));
      }

      if (filter.upcoming) {
        const now = new Date();
        query = query.where(
          and(
            eq(maintenances.status, 'scheduled'),
            gte(maintenances.scheduledStartTime, now)
          )
        );
      }

      if (filter.startDate) {
        query = query.where(gte(maintenances.scheduledStartTime, filter.startDate));
      }

      if (filter.endDate) {
        query = query.where(lte(maintenances.scheduledEndTime, filter.endDate));
      }
    }

    const data = await query
      .limit(limit)
      .offset(offset)
      .orderBy(maintenances.scheduledStartTime);

    // Count total maintenances matching the filter
    let countQuery = db.select({
      count: sql<number>`count(*)`
    })
    .from(maintenances)
    .where(eq(maintenances.organizationId, organizationId));

    // Apply the same filters to the count query
    if (filter) {
      if (filter.status === 'active') {
        countQuery = countQuery.where(or(
          eq(maintenances.status, 'scheduled'),
          eq(maintenances.status, 'in_progress')
        ));
      } else if (filter.status) {
        countQuery = countQuery.where(eq(maintenances.status, filter.status));
      }

      if (filter.upcoming) {
        const now = new Date();
        countQuery = countQuery.where(
          and(
            eq(maintenances.status, 'scheduled'),
            gte(maintenances.scheduledStartTime, now)
          )
        );
      }

      if (filter.startDate) {
        countQuery = countQuery.where(gte(maintenances.scheduledStartTime, filter.startDate));
      }

      if (filter.endDate) {
        countQuery = countQuery.where(lte(maintenances.scheduledEndTime, filter.endDate));
      }
    }

    const [{ count }] = await countQuery;

    return {
      data: data.map(maintenance => new MaintenanceEntity(maintenance)),
      total: count,
    };
  }

  async update(maintenance: MaintenanceEntity): Promise<MaintenanceEntity> {
    const updated = await db.update(maintenances)
      .set({
        title: maintenance.title,
        description: maintenance.description,
        status: maintenance.status,
        scheduledStartTime: maintenance.scheduledStartTime,
        scheduledEndTime: maintenance.scheduledEndTime,
        actualStartTime: maintenance.actualStartTime,
        actualEndTime: maintenance.actualEndTime,
        updatedAt: maintenance.updatedAt,
      })
      .where(eq(maintenances.id, maintenance.id))
      .returning();

    const updatedMaintenance = new MaintenanceEntity(updated[0]);

    // Emit WebSocket event for maintenance update
    emitToOrganization(
      updatedMaintenance.organizationId,
      SocketEventType.MAINTENANCE_UPDATE,
      {
        maintenanceId: updatedMaintenance.id,
        title: updatedMaintenance.title,
        status: updatedMaintenance.status,
        scheduledStartTime: updatedMaintenance.scheduledStartTime,
        scheduledEndTime: updatedMaintenance.scheduledEndTime,
        actualStartTime: updatedMaintenance.actualStartTime,
        actualEndTime: updatedMaintenance.actualEndTime,
        updatedAt: updatedMaintenance.updatedAt
      }
    );

    return updatedMaintenance;
  }

  async delete(id: string): Promise<void> {
    await db.delete(maintenances)
      .where(eq(maintenances.id, id));
  }

  async updateStatus(id: string, status: MaintenanceStatus): Promise<MaintenanceEntity> {
    const maintenance = await this.findById(id);
    
    if (!maintenance) {
      throw new Error(`Maintenance with ID ${id} not found`);
    }
    
    // Check if the status transition is valid
    if (!maintenance.canTransitionTo(status)) {
      throw new Error(`Invalid status transition from ${maintenance.status} to ${status}`);
    }
    
    // Update the maintenance status
    maintenance.updateStatus(status);
    
    const updated = await db.update(maintenances)
      .set({
        status: maintenance.status,
        actualStartTime: maintenance.actualStartTime,
        actualEndTime: maintenance.actualEndTime,
        updatedAt: maintenance.updatedAt,
      })
      .where(eq(maintenances.id, id))
      .returning();

    const updatedMaintenance = new MaintenanceEntity(updated[0]);
    
    // Emit WebSocket event for maintenance status change
    emitToOrganization(
      updatedMaintenance.organizationId,
      SocketEventType.MAINTENANCE_STATUS_CHANGE,
      {
        maintenanceId: updatedMaintenance.id,
        status: updatedMaintenance.status,
        title: updatedMaintenance.title,
        actualStartTime: updatedMaintenance.actualStartTime,
        actualEndTime: updatedMaintenance.actualEndTime,
        updatedAt: updatedMaintenance.updatedAt
      }
    );

    return updatedMaintenance;
  }

  async addServiceToMaintenance(maintenanceId: string, serviceId: string): Promise<void> {
    // Check if the association already exists
    const existing = await db.select()
      .from(serviceMaintenances)
      .where(
        and(
          eq(serviceMaintenances.maintenanceId, maintenanceId),
          eq(serviceMaintenances.serviceId, serviceId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(serviceMaintenances)
        .values({
          id: crypto.randomUUID(),
          serviceId,
          maintenanceId,
          createdAt: new Date(),
        });
    }
  }

  async removeServiceFromMaintenance(maintenanceId: string, serviceId: string): Promise<void> {
    await db.delete(serviceMaintenances)
      .where(
        and(
          eq(serviceMaintenances.maintenanceId, maintenanceId),
          eq(serviceMaintenances.serviceId, serviceId)
        )
      );
  }

  async getServicesForMaintenance(maintenanceId: string): Promise<string[]> {
    const associations = await db.select()
      .from(serviceMaintenances)
      .where(eq(serviceMaintenances.maintenanceId, maintenanceId));

    return associations.map(association => association.serviceId);
  }

  async getMaintenancesForService(serviceId: string, filter?: MaintenanceFilter): Promise<MaintenanceEntity[]> {
    // This query gets all maintenance IDs associated with this service
    const serviceMaintenanceQuery = db.select({ maintenanceId: serviceMaintenances.maintenanceId })
      .from(serviceMaintenances)
      .where(eq(serviceMaintenances.serviceId, serviceId));

    // Then we fetch the full maintenance details with any additional filters
    let query = db.select()
      .from(maintenances)
      .where(
        sql`${maintenances.id} IN (${serviceMaintenanceQuery.getSQL()})`
      );

    // Apply additional filters
    if (filter) {
      if (filter.status === 'active') {
        query = query.where(or(
          eq(maintenances.status, 'scheduled'),
          eq(maintenances.status, 'in_progress')
        ));
      } else if (filter.status) {
        query = query.where(eq(maintenances.status, filter.status));
      }

      if (filter.upcoming) {
        const now = new Date();
        query = query.where(
          and(
            eq(maintenances.status, 'scheduled'),
            gte(maintenances.scheduledStartTime, now)
          )
        );
      }

      if (filter.startDate) {
        query = query.where(gte(maintenances.scheduledStartTime, filter.startDate));
      }

      if (filter.endDate) {
        query = query.where(lte(maintenances.scheduledEndTime, filter.endDate));
      }
    }

    const data = await query.orderBy(maintenances.scheduledStartTime);

    return data.map(maintenance => new MaintenanceEntity(maintenance));
  }
} 