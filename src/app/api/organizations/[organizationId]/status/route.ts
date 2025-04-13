import { NextRequest, NextResponse } from "next/server";
import { ServiceRepositoryImpl } from "@/infrastructure/repositories/ServiceRepositoryImpl";
import { OrganizationRepositoryImpl } from "@/infrastructure/repositories/OrganizationRepositoryImpl";
import { ServiceEntity } from "@/domain/entities/Service";

const serviceRepository = new ServiceRepositoryImpl();
const organizationRepository = new OrganizationRepositoryImpl();

// Get overall status of all services in an organization
export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;
    
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
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

    // Get public services for the organization
    const services = await serviceRepository.getPublicServices(organizationId);

    // Calculate overall status
    const statuses = services.map(service => service.status);
    const overallStatus = ServiceEntity.getHighestSeverityStatus(statuses);

    // Prepare response data
    const response = {
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
      overallStatus,
      services: services.map(service => ({
        id: service.id,
        name: service.name,
        status: service.status,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching organization status:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization status" },
      { status: 500 }
    );
  }
} 