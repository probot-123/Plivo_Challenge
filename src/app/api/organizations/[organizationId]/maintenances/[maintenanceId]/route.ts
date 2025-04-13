import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { MaintenanceRepositoryImpl } from "@/infrastructure/repositories/MaintenanceRepositoryImpl";
import { OrganizationRepositoryImpl } from "@/infrastructure/repositories/OrganizationRepositoryImpl";
import { ServiceRepositoryImpl } from "@/infrastructure/repositories/ServiceRepositoryImpl";
import { MaintenanceStatus } from "@/domain/entities/Maintenance";
import { z } from "zod";

const maintenanceRepository = new MaintenanceRepositoryImpl();
const organizationRepository = new OrganizationRepositoryImpl();
const serviceRepository = new ServiceRepositoryImpl();

// Validation schema for updating a maintenance
const updateMaintenanceSchema = z.object({
  title: z.string().min(1, "Title is required").max(200).optional(),
  description: z.string().optional(),
  scheduledStartTime: z.string().transform(val => new Date(val)).optional(),
  scheduledEndTime: z.string().transform(val => new Date(val)).optional(),
});

// Validation schema for updating status
const updateStatusSchema = z.object({
  status: z.enum(['scheduled', 'in_progress', 'completed']),
  actualStartTime: z.string().transform(val => new Date(val)).optional(),
  actualEndTime: z.string().transform(val => new Date(val)).optional(),
});

// Validation schema for managing services
const manageServicesSchema = z.object({
  action: z.enum(['add', 'remove']),
  serviceIds: z.array(z.string().uuid()),
});

// Get a single maintenance by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string; maintenanceId: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId, maintenanceId } = params;
    
    if (!organizationId || !maintenanceId) {
      return NextResponse.json(
        { error: "Organization ID and Maintenance ID are required" },
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

    // Get the maintenance
    const maintenance = await maintenanceRepository.findById(maintenanceId);
    
    if (!maintenance) {
      return NextResponse.json(
        { error: "Maintenance not found" },
        { status: 404 }
      );
    }

    // Check if the maintenance belongs to the organization
    if (maintenance.organizationId !== organizationId) {
      return NextResponse.json(
        { error: "Maintenance does not belong to this organization" },
        { status: 403 }
      );
    }

    // Get services for the maintenance
    const serviceIds = await maintenanceRepository.getServicesForMaintenance(maintenanceId);
    const services = await serviceRepository.getServicesByIds(serviceIds);

    return NextResponse.json({
      ...maintenance,
      services: services.map(service => ({
        id: service.id,
        name: service.name,
        status: service.status,
      })),
    });
  } catch (error) {
    console.error("Error fetching maintenance:", error);
    return NextResponse.json(
      { error: "Failed to fetch maintenance" },
      { status: 500 }
    );
  }
}

// Update a maintenance
export async function PATCH(
  request: NextRequest,
  { params }: { params: { organizationId: string; maintenanceId: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId, maintenanceId } = params;
    
    if (!organizationId || !maintenanceId) {
      return NextResponse.json(
        { error: "Organization ID and Maintenance ID are required" },
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

    // Get the maintenance
    const maintenance = await maintenanceRepository.findById(maintenanceId);
    
    if (!maintenance) {
      return NextResponse.json(
        { error: "Maintenance not found" },
        { status: 404 }
      );
    }

    // Check if the maintenance belongs to the organization
    if (maintenance.organizationId !== organizationId) {
      return NextResponse.json(
        { error: "Maintenance does not belong to this organization" },
        { status: 403 }
      );
    }

    // Parse the request body
    const body = await request.json();

    // Check what type of update this is (general update, status update, or service management)
    if (body.status !== undefined) {
      // Status update
      const validationResult = updateStatusSchema.safeParse(body);
      
      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation error", details: validationResult.error.format() },
          { status: 400 }
        );
      }

      const { status, actualStartTime, actualEndTime } = validationResult.data;

      // Validate the status transition
      if (!maintenance.canTransitionTo(status)) {
        return NextResponse.json(
          { error: `Cannot transition from ${maintenance.status} to ${status}` },
          { status: 400 }
        );
      }

      // Handle status updates with time tracking
      if (status === 'in_progress' && actualStartTime) {
        maintenance.actualStartTime = actualStartTime;
      } else if (status === 'completed' && actualEndTime) {
        maintenance.actualEndTime = actualEndTime;
      }

      // Update the status
      await maintenanceRepository.updateStatus(maintenanceId, status);

      // Get the updated maintenance
      const updatedMaintenance = await maintenanceRepository.findById(maintenanceId);
      
      if (!updatedMaintenance) {
        return NextResponse.json(
          { error: "Failed to update maintenance status" },
          { status: 500 }
        );
      }

      // Get services for the maintenance
      const serviceIds = await maintenanceRepository.getServicesForMaintenance(maintenanceId);
      const services = await serviceRepository.getServicesByIds(serviceIds);

      return NextResponse.json({
        ...updatedMaintenance,
        services: services.map(service => ({
          id: service.id,
          name: service.name,
          status: service.status,
        })),
      });
    } else if (body.action !== undefined) {
      // Service management
      const validationResult = manageServicesSchema.safeParse(body);
      
      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation error", details: validationResult.error.format() },
          { status: 400 }
        );
      }

      const { action, serviceIds } = validationResult.data;

      // Process service management
      if (action === 'add') {
        await Promise.all(
          serviceIds.map(serviceId => 
            maintenanceRepository.addServiceToMaintenance(maintenanceId, serviceId)
          )
        );
      } else if (action === 'remove') {
        await Promise.all(
          serviceIds.map(serviceId => 
            maintenanceRepository.removeServiceFromMaintenance(maintenanceId, serviceId)
          )
        );
      }

      // Get updated services for the maintenance
      const updatedServiceIds = await maintenanceRepository.getServicesForMaintenance(maintenanceId);
      const services = await serviceRepository.getServicesByIds(updatedServiceIds);

      return NextResponse.json({
        ...maintenance,
        services: services.map(service => ({
          id: service.id,
          name: service.name,
          status: service.status,
        })),
      });
    } else {
      // General maintenance update
      const validationResult = updateMaintenanceSchema.safeParse(body);
      
      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation error", details: validationResult.error.format() },
          { status: 400 }
        );
      }

      const { title, description, scheduledStartTime, scheduledEndTime } = validationResult.data;

      // Validate time range if both times are provided
      if (scheduledStartTime && scheduledEndTime && scheduledStartTime >= scheduledEndTime) {
        return NextResponse.json(
          { error: "Scheduled end time must be after scheduled start time" },
          { status: 400 }
        );
      }

      // Update the maintenance
      maintenance.update({
        title,
        description,
        scheduledStartTime,
        scheduledEndTime,
      });

      const updatedMaintenance = await maintenanceRepository.update(maintenance);

      // Get services for the maintenance
      const serviceIds = await maintenanceRepository.getServicesForMaintenance(maintenanceId);
      const services = await serviceRepository.getServicesByIds(serviceIds);

      return NextResponse.json({
        ...updatedMaintenance,
        services: services.map(service => ({
          id: service.id,
          name: service.name,
          status: service.status,
        })),
      });
    }
  } catch (error) {
    console.error("Error updating maintenance:", error);
    return NextResponse.json(
      { error: "Failed to update maintenance" },
      { status: 500 }
    );
  }
}

// Delete a maintenance
export async function DELETE(
  request: NextRequest,
  { params }: { params: { organizationId: string; maintenanceId: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId, maintenanceId } = params;
    
    if (!organizationId || !maintenanceId) {
      return NextResponse.json(
        { error: "Organization ID and Maintenance ID are required" },
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

    // Get the maintenance
    const maintenance = await maintenanceRepository.findById(maintenanceId);
    
    if (!maintenance) {
      return NextResponse.json(
        { error: "Maintenance not found" },
        { status: 404 }
      );
    }

    // Check if the maintenance belongs to the organization
    if (maintenance.organizationId !== organizationId) {
      return NextResponse.json(
        { error: "Maintenance does not belong to this organization" },
        { status: 403 }
      );
    }

    // Delete the maintenance
    await maintenanceRepository.delete(maintenanceId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting maintenance:", error);
    return NextResponse.json(
      { error: "Failed to delete maintenance" },
      { status: 500 }
    );
  }
} 