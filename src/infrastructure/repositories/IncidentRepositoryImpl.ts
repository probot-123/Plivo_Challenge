import { db } from "../db/connection";
import { incidents, incidentUpdates, serviceIncidents } from "../db/schema";
import { IncidentRepository, IncidentFilter } from "@/domain/repositories/IncidentRepository";
import { IncidentEntity, IncidentStatus } from "@/domain/entities/Incident";
import { IncidentUpdateEntity } from "@/domain/entities/IncidentUpdate";
import { eq, and, or, desc, sql, lt, gte, lte, isNull } from "drizzle-orm";
import { emitToOrganization, SocketEventType } from '@/lib/socketServer';

export class IncidentRepositoryImpl implements IncidentRepository {
  async create(incident: IncidentEntity): Promise<IncidentEntity> {
    const created = await db.insert(incidents)
      .values({
        id: incident.id,
        title: incident.title,
        description: incident.description,
        status: incident.status,
        severity: incident.severity,
        organizationId: incident.organizationId,
        createdById: incident.createdById,
        startedAt: incident.startedAt,
        resolvedAt: incident.resolvedAt,
        createdAt: incident.createdAt,
        updatedAt: incident.updatedAt,
      })
      .returning();

    const createdIncident = new IncidentEntity(created[0]);

    // Emit WebSocket event for incident creation
    emitToOrganization(
      createdIncident.organizationId,
      SocketEventType.INCIDENT_CREATE,
      {
        incidentId: createdIncident.id,
        title: createdIncident.title,
        status: createdIncident.status,
        severity: createdIncident.severity,
        createdAt: createdIncident.createdAt
      }
    );

    return createdIncident;
  }

  async findById(id: string): Promise<IncidentEntity | null> {
    const result = await db.select()
      .from(incidents)
      .where(eq(incidents.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return new IncidentEntity(result[0]);
  }

  async findByOrganizationId(organizationId: string, filter?: IncidentFilter): Promise<{ data: IncidentEntity[]; total: number }> {
    const page = filter?.page || 1;
    const limit = filter?.limit || 10;
    const offset = (page - 1) * limit;

    let query = db.select()
      .from(incidents)
      .where(eq(incidents.organizationId, organizationId));

    // Apply additional filters
    if (filter) {
      if (filter.status === 'active') {
        query = query.where(or(
          isNull(incidents.resolvedAt),
          eq(incidents.status, 'investigating'),
          eq(incidents.status, 'identified'),
          eq(incidents.status, 'monitoring')
        ));
      } else if (filter.status) {
        query = query.where(eq(incidents.status, filter.status));
      }

      if (filter.startDate) {
        query = query.where(gte(incidents.createdAt, filter.startDate));
      }

      if (filter.endDate) {
        query = query.where(lte(incidents.createdAt, filter.endDate));
      }
    }

    const data = await query
      .limit(limit)
      .offset(offset)
      .orderBy(desc(incidents.createdAt));

    // Count total incidents matching the filter
    let countQuery = db.select({
      count: sql<number>`count(*)`
    })
    .from(incidents)
    .where(eq(incidents.organizationId, organizationId));

    // Apply the same filters to the count query
    if (filter) {
      if (filter.status === 'active') {
        countQuery = countQuery.where(or(
          isNull(incidents.resolvedAt),
          eq(incidents.status, 'investigating'),
          eq(incidents.status, 'identified'),
          eq(incidents.status, 'monitoring')
        ));
      } else if (filter.status) {
        countQuery = countQuery.where(eq(incidents.status, filter.status));
      }

      if (filter.startDate) {
        countQuery = countQuery.where(gte(incidents.createdAt, filter.startDate));
      }

      if (filter.endDate) {
        countQuery = countQuery.where(lte(incidents.createdAt, filter.endDate));
      }
    }

    const [{ count }] = await countQuery;

    return {
      data: data.map(incident => new IncidentEntity(incident)),
      total: count,
    };
  }

  async update(incident: IncidentEntity): Promise<IncidentEntity> {
    const updated = await db.update(incidents)
      .set({
        title: incident.title,
        description: incident.description,
        status: incident.status,
        severity: incident.severity,
        startedAt: incident.startedAt,
        resolvedAt: incident.resolvedAt,
        updatedAt: incident.updatedAt,
      })
      .where(eq(incidents.id, incident.id))
      .returning();

    const updatedIncident = new IncidentEntity(updated[0]);

    // Emit WebSocket event for incident update
    emitToOrganization(
      updatedIncident.organizationId,
      SocketEventType.INCIDENT_UPDATE,
      {
        incidentId: updatedIncident.id,
        title: updatedIncident.title,
        status: updatedIncident.status,
        severity: updatedIncident.severity,
        updatedAt: updatedIncident.updatedAt
      }
    );

    return updatedIncident;
  }

  async delete(id: string): Promise<void> {
    await db.delete(incidents)
      .where(eq(incidents.id, id));
  }

  async updateStatus(id: string, status: IncidentStatus, updateMessage?: string, userId?: string): Promise<IncidentEntity> {
    const incident = await this.findById(id);
    
    if (!incident) {
      throw new Error(`Incident with ID ${id} not found`);
    }
    
    // Check if the status transition is valid
    if (!incident.canTransitionTo(status)) {
      throw new Error(`Invalid status transition from ${incident.status} to ${status}`);
    }
    
    // Update the incident status
    incident.updateStatus(status);
    
    const updated = await db.update(incidents)
      .set({
        status: incident.status,
        updatedAt: incident.updatedAt,
        resolvedAt: incident.resolvedAt,
      })
      .where(eq(incidents.id, id))
      .returning();
    
    // Create an incident update if a message was provided
    if (updateMessage) {
      const incidentUpdate = IncidentUpdateEntity.create({
        incidentId: id,
        message: updateMessage,
        status,
        createdById: userId,
      });
      
      await this.addUpdate(incidentUpdate);
    }

    return new IncidentEntity(updated[0]);
  }

  async addUpdate(incidentUpdate: IncidentUpdateEntity): Promise<IncidentUpdateEntity> {
    const created = await db.insert(incidentUpdates)
      .values({
        id: incidentUpdate.id,
        incidentId: incidentUpdate.incidentId,
        message: incidentUpdate.message,
        status: incidentUpdate.status,
        createdById: incidentUpdate.createdById,
        createdAt: incidentUpdate.createdAt,
      })
      .returning();

    return new IncidentUpdateEntity(created[0]);
  }

  async getUpdates(incidentId: string): Promise<IncidentUpdateEntity[]> {
    const updates = await db.select()
      .from(incidentUpdates)
      .where(eq(incidentUpdates.incidentId, incidentId))
      .orderBy(desc(incidentUpdates.createdAt));

    return updates.map(update => new IncidentUpdateEntity(update));
  }

  async addServiceToIncident(incidentId: string, serviceId: string): Promise<void> {
    // Check if the association already exists
    const existing = await db.select()
      .from(serviceIncidents)
      .where(
        and(
          eq(serviceIncidents.incidentId, incidentId),
          eq(serviceIncidents.serviceId, serviceId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(serviceIncidents)
        .values({
          id: crypto.randomUUID(),
          serviceId,
          incidentId,
          createdAt: new Date(),
        });
    }
  }

  async removeServiceFromIncident(incidentId: string, serviceId: string): Promise<void> {
    await db.delete(serviceIncidents)
      .where(
        and(
          eq(serviceIncidents.incidentId, incidentId),
          eq(serviceIncidents.serviceId, serviceId)
        )
      );
  }

  async getServicesForIncident(incidentId: string): Promise<string[]> {
    const associations = await db.select()
      .from(serviceIncidents)
      .where(eq(serviceIncidents.incidentId, incidentId));

    return associations.map(association => association.serviceId);
  }

  async getIncidentsForService(serviceId: string, filter?: IncidentFilter): Promise<IncidentEntity[]> {
    // This query gets all incident IDs associated with this service
    const serviceIncidentQuery = db.select({ incidentId: serviceIncidents.incidentId })
      .from(serviceIncidents)
      .where(eq(serviceIncidents.serviceId, serviceId));

    // Then we fetch the full incident details with any additional filters
    let query = db.select()
      .from(incidents)
      .where(
        sql`${incidents.id} IN (${serviceIncidentQuery.getSQL()})`
      );

    // Apply additional filters
    if (filter) {
      if (filter.status === 'active') {
        query = query.where(or(
          isNull(incidents.resolvedAt),
          eq(incidents.status, 'investigating'),
          eq(incidents.status, 'identified'),
          eq(incidents.status, 'monitoring')
        ));
      } else if (filter.status) {
        query = query.where(eq(incidents.status, filter.status));
      }

      if (filter.startDate) {
        query = query.where(gte(incidents.createdAt, filter.startDate));
      }

      if (filter.endDate) {
        query = query.where(lte(incidents.createdAt, filter.endDate));
      }
    }

    const data = await query.orderBy(desc(incidents.createdAt));

    return data.map(incident => new IncidentEntity(incident));
  }
} 