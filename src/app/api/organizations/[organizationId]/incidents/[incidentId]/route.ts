import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { IncidentRepositoryImpl } from "@/infrastructure/repositories/IncidentRepositoryImpl";
import { OrganizationRepositoryImpl } from "@/infrastructure/repositories/OrganizationRepositoryImpl";
import { ServiceRepositoryImpl } from "@/infrastructure/repositories/ServiceRepositoryImpl";
import { IncidentStatus } from "@/domain/entities/Incident";
import { ServiceStatus } from "@/domain/entities/Service";
import { z } from "zod";

const incidentRepository = new IncidentRepositoryImpl();
const organizationRepository = new OrganizationRepositoryImpl();
const serviceRepository = new ServiceRepositoryImpl();

// Validation schema for updating an incident
const updateIncidentSchema = z.object({
  title: z.string().min(1, "Title is required").max(200).optional(),
  description: z.string().optional().nullable(),
  impact: z.enum(['operational', 'degraded', 'partial_outage', 'major_outage']).optional(),
});

// Validation schema for updating incident status
const updateStatusSchema = z.object({
  status: z.enum(['investigating', 'identified', 'monitoring', 'resolved']),
  message: z.string().min(1, "Update message is required"),
});

// Validation schema for managing services
const manageServicesSchema = z.object({
  serviceIds: z.array(z.string().uuid()),
  action: z.enum(['add', 'remove']),
});

// Get an incident by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string; incidentId: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId, incidentId } = params;
    
    if (!organizationId || !incidentId) {
      return NextResponse.json(
        { error: "Organization ID and Incident ID are required" },
        { status: 400 }
      );
    }

    // Check if the organization exists
    const organization = await organizationRepository.findById(organizationId);
    
    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Get the incident
    const incident = await incidentRepository.findById(incidentId);
    
    if (!incident) {
      return NextResponse.json(
        { error: "Incident not found" },
        { status: 404 }
      );
    }

    // Check if the incident belongs to the organization
    if (incident.organizationId !== organizationId) {
      return NextResponse.json(
        { error: "Incident does not belong to the organization" },
        { status: 403 }
      );
    }

    // Get services affected by the incident
    const serviceIds = await incidentRepository.getServicesForIncident(incidentId);
    const services = await serviceRepository.getServicesByIds(serviceIds);
    
    // Get incident updates
    const updates = await incidentRepository.getUpdates(incidentId);

    return NextResponse.json({
      ...incident,
      services: services.map(service => ({
        id: service.id,
        name: service.name,
        status: service.status,
      })),
      updates,
    });
  } catch (error) {
    console.error("Error fetching incident:", error);
    return NextResponse.json(
      { error: "Failed to fetch incident" },
      { status: 500 }
    );
  }
}

// Update an incident
export async function PATCH(
  request: NextRequest,
  { params }: { params: { organizationId: string; incidentId: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId, incidentId } = params;
    
    if (!organizationId || !incidentId) {
      return NextResponse.json(
        { error: "Organization ID and Incident ID are required" },
        { status: 400 }
      );
    }

    // Check if the organization exists
    const organization = await organizationRepository.findById(organizationId);
    
    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Get the incident
    const incident = await incidentRepository.findById(incidentId);
    
    if (!incident) {
      return NextResponse.json(
        { error: "Incident not found" },
        { status: 404 }
      );
    }

    // Check if the incident belongs to the organization
    if (incident.organizationId !== organizationId) {
      return NextResponse.json(
        { error: "Incident does not belong to the organization" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Check if we're updating the status
    if (body.status !== undefined) {
      const validationResult = updateStatusSchema.safeParse(body);
      
      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation error", details: validationResult.error.format() },
          { status: 400 }
        );
      }

      const { status, message } = validationResult.data;

      // Check if the status transition is valid
      if (!incident.canTransitionTo(status)) {
        return NextResponse.json(
          { error: `Invalid status transition from ${incident.status} to ${status}` },
          { status: 400 }
        );
      }

      // Update incident status with a comment
      const updatedIncident = await incidentRepository.updateStatus(
        incidentId,
        status as IncidentStatus,
        message,
        userId
      );

      // Get services affected by the incident
      const serviceIds = await incidentRepository.getServicesForIncident(incidentId);
      
      // If the incident is resolved, update the affected services to operational
      if (status === 'resolved') {
        await Promise.all(
          serviceIds.map(serviceId => 
            serviceRepository.updateStatus(serviceId, 'operational')
          )
        );
      }

      return NextResponse.json(updatedIncident);
    }
    // Check if we're managing services
    else if (body.serviceIds !== undefined && body.action !== undefined) {
      const validationResult = manageServicesSchema.safeParse(body);
      
      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation error", details: validationResult.error.format() },
          { status: 400 }
        );
      }

      const { serviceIds, action } = validationResult.data;

      if (action === 'add') {
        await Promise.all(
          serviceIds.map(serviceId => 
            incidentRepository.addServiceToIncident(incidentId, serviceId)
          )
        );

        // Update the status of the affected services to match the incident impact
        await Promise.all(
          serviceIds.map(serviceId => 
            serviceRepository.updateStatus(serviceId, incident.impact)
          )
        );
      } else if (action === 'remove') {
        await Promise.all(
          serviceIds.map(serviceId => 
            incidentRepository.removeServiceFromIncident(incidentId, serviceId)
          )
        );

        // Reset the status of the removed services to operational
        await Promise.all(
          serviceIds.map(serviceId => 
            serviceRepository.updateStatus(serviceId, 'operational')
          )
        );
      }

      // Get updated services
      const updatedServiceIds = await incidentRepository.getServicesForIncident(incidentId);
      const services = await serviceRepository.getServicesByIds(updatedServiceIds);

      return NextResponse.json({
        ...incident,
        services: services.map(service => ({
          id: service.id,
          name: service.name,
          status: service.status,
        })),
      });
    }
    // Otherwise, it's a general update
    else {
      const validationResult = updateIncidentSchema.safeParse(body);
      
      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation error", details: validationResult.error.format() },
          { status: 400 }
        );
      }

      const { title, description, impact } = validationResult.data;

      // Update the incident
      incident.update({
        title,
        description,
        impact: impact as ServiceStatus,
      });

      const updatedIncident = await incidentRepository.update(incident);

      // If impact changed, update the status of affected services
      if (impact) {
        const serviceIds = await incidentRepository.getServicesForIncident(incidentId);
        await Promise.all(
          serviceIds.map(serviceId => 
            serviceRepository.updateStatus(serviceId, impact as ServiceStatus)
          )
        );
      }

      return NextResponse.json(updatedIncident);
    }
  } catch (error) {
    console.error("Error updating incident:", error);
    return NextResponse.json(
      { error: "Failed to update incident" },
      { status: 500 }
    );
  }
}

// Delete an incident
export async function DELETE(
  request: NextRequest,
  { params }: { params: { organizationId: string; incidentId: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId, incidentId } = params;
    
    if (!organizationId || !incidentId) {
      return NextResponse.json(
        { error: "Organization ID and Incident ID are required" },
        { status: 400 }
      );
    }

    // Check if the organization exists
    const organization = await organizationRepository.findById(organizationId);
    
    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Get the incident
    const incident = await incidentRepository.findById(incidentId);
    
    if (!incident) {
      return NextResponse.json(
        { error: "Incident not found" },
        { status: 404 }
      );
    }

    // Check if the incident belongs to the organization
    if (incident.organizationId !== organizationId) {
      return NextResponse.json(
        { error: "Incident does not belong to the organization" },
        { status: 403 }
      );
    }

    // Get services affected by the incident
    const serviceIds = await incidentRepository.getServicesForIncident(incidentId);
    
    // Reset the status of the affected services to operational
    await Promise.all(
      serviceIds.map(serviceId => 
        serviceRepository.updateStatus(serviceId, 'operational')
      )
    );

    // Delete the incident
    await incidentRepository.delete(incidentId);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting incident:", error);
    return NextResponse.json(
      { error: "Failed to delete incident" },
      { status: 500 }
    );
  }
} 