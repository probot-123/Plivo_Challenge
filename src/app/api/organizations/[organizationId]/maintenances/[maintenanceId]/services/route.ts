import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { MaintenanceRepositoryImpl } from "@/infrastructure/repositories/MaintenanceRepositoryImpl";
import { OrganizationRepositoryImpl } from "@/infrastructure/repositories/OrganizationRepositoryImpl";
import { ServiceRepositoryImpl } from "@/infrastructure/repositories/ServiceRepositoryImpl";
import { z } from "zod";

const maintenanceRepository = new MaintenanceRepositoryImpl();
const organizationRepository = new OrganizationRepositoryImpl();
const serviceRepository = new ServiceRepositoryImpl();

// Validation schema for service management
const manageServicesSchema = z.object({
  serviceIds: z.array(z.string().uuid()),
});

// Get all services associated with a maintenance
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
      services: services.map(service => ({
        id: service.id,
        name: service.name,
        status: service.status,
        description: service.description,
      })),
    });
  } catch (error) {
    console.error("Error fetching maintenance services:", error);
    return NextResponse.json(
      { error: "Failed to fetch maintenance services" },
      { status: 500 }
    );
  }
}

// Add services to a maintenance
export async function POST(
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
    
    // Validate the request body
    const validationResult = manageServicesSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { serviceIds } = validationResult.data;

    // Check if all services exist and belong to the organization
    const services = await serviceRepository.getServicesByIds(serviceIds);
    
    if (services.length !== serviceIds.length) {
      return NextResponse.json(
        { error: "One or more services not found" },
        { status: 404 }
      );
    }

    const nonOrgServices = services.filter(service => service.organizationId !== organizationId);
    
    if (nonOrgServices.length > 0) {
      return NextResponse.json(
        { error: "One or more services do not belong to this organization" },
        { status: 403 }
      );
    }

    // Add services to the maintenance
    await Promise.all(
      serviceIds.map(serviceId => 
        maintenanceRepository.addServiceToMaintenance(maintenanceId, serviceId)
      )
    );

    // Get updated services for the maintenance
    const updatedServiceIds = await maintenanceRepository.getServicesForMaintenance(maintenanceId);
    const updatedServices = await serviceRepository.getServicesByIds(updatedServiceIds);

    return NextResponse.json({
      services: updatedServices.map(service => ({
        id: service.id,
        name: service.name,
        status: service.status,
        description: service.description,
      })),
    });
  } catch (error) {
    console.error("Error adding services to maintenance:", error);
    return NextResponse.json(
      { error: "Failed to add services to maintenance" },
      { status: 500 }
    );
  }
}

// Remove services from a maintenance
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

    // Parse the request body
    const body = await request.json();
    
    // Validate the request body
    const validationResult = manageServicesSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { serviceIds } = validationResult.data;

    // Remove services from the maintenance
    await Promise.all(
      serviceIds.map(serviceId => 
        maintenanceRepository.removeServiceFromMaintenance(maintenanceId, serviceId)
      )
    );

    // Get updated services for the maintenance
    const updatedServiceIds = await maintenanceRepository.getServicesForMaintenance(maintenanceId);
    const updatedServices = await serviceRepository.getServicesByIds(updatedServiceIds);

    return NextResponse.json({
      services: updatedServices.map(service => ({
        id: service.id,
        name: service.name,
        status: service.status,
        description: service.description,
      })),
    });
  } catch (error) {
    console.error("Error removing services from maintenance:", error);
    return NextResponse.json(
      { error: "Failed to remove services from maintenance" },
      { status: 500 }
    );
  }
} 