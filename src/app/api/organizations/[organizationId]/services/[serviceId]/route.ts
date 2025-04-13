import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { ServiceRepositoryImpl } from "@/infrastructure/repositories/ServiceRepositoryImpl";
import { OrganizationRepositoryImpl } from "@/infrastructure/repositories/OrganizationRepositoryImpl";
import { ServiceStatus } from "@/domain/entities/Service";
import { z } from "zod";

const serviceRepository = new ServiceRepositoryImpl();
const organizationRepository = new OrganizationRepositoryImpl();

// Validation schema for updating a service
const updateServiceSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  description: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
});

// Validation schema for updating a service status
const updateStatusSchema = z.object({
  status: z.enum(['operational', 'degraded', 'partial_outage', 'major_outage']),
});

// Get a single service
export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string; serviceId: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId, serviceId } = params;
    
    if (!organizationId || !serviceId) {
      return NextResponse.json(
        { error: "Organization ID and Service ID are required" },
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

    // Get the service
    const service = await serviceRepository.findById(serviceId);
    
    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // Ensure the service belongs to the organization
    if (service.organizationId !== organizationId) {
      return NextResponse.json(
        { error: "Service does not belong to the organization" },
        { status: 403 }
      );
    }

    // Get status history
    const url = new URL(request.url);
    const includeHistory = url.searchParams.get("include_history") === "true";
    let history = null;
    
    if (includeHistory) {
      const { data } = await serviceRepository.getStatusHistory(serviceId, 1, 10);
      history = data;
    }

    return NextResponse.json({
      ...service,
      history,
    });
  } catch (error) {
    console.error("Error fetching service:", error);
    return NextResponse.json(
      { error: "Failed to fetch service" },
      { status: 500 }
    );
  }
}

// Update a service
export async function PATCH(
  request: NextRequest,
  { params }: { params: { organizationId: string; serviceId: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId, serviceId } = params;
    
    if (!organizationId || !serviceId) {
      return NextResponse.json(
        { error: "Organization ID and Service ID are required" },
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

    // Get the service
    const service = await serviceRepository.findById(serviceId);
    
    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // Ensure the service belongs to the organization
    if (service.organizationId !== organizationId) {
      return NextResponse.json(
        { error: "Service does not belong to the organization" },
        { status: 403 }
      );
    }

    // Parse and validate the request body
    const body = await request.json();
    
    // Check if this is a status update
    if (body.status !== undefined) {
      const validationResult = updateStatusSchema.safeParse(body);
      
      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation error", details: validationResult.error.format() },
          { status: 400 }
        );
      }

      const { status } = validationResult.data;
      const updatedService = await serviceRepository.updateStatus(serviceId, status as ServiceStatus);
      
      return NextResponse.json(updatedService);
    }
    
    // Otherwise, it's a general update
    const validationResult = updateServiceSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { name, description, isPublic } = validationResult.data;

    // Update the service
    service.update({
      name,
      description,
      isPublic,
    });

    const updatedService = await serviceRepository.update(service);

    return NextResponse.json(updatedService);
  } catch (error) {
    console.error("Error updating service:", error);
    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 }
    );
  }
}

// Delete a service
export async function DELETE(
  request: NextRequest,
  { params }: { params: { organizationId: string; serviceId: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId, serviceId } = params;
    
    if (!organizationId || !serviceId) {
      return NextResponse.json(
        { error: "Organization ID and Service ID are required" },
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

    // Get the service
    const service = await serviceRepository.findById(serviceId);
    
    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // Ensure the service belongs to the organization
    if (service.organizationId !== organizationId) {
      return NextResponse.json(
        { error: "Service does not belong to the organization" },
        { status: 403 }
      );
    }

    // Delete the service
    await serviceRepository.delete(serviceId);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting service:", error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
} 