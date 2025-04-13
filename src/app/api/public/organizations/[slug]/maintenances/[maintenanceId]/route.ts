import { NextRequest, NextResponse } from 'next/server';
import { OrganizationRepositoryImpl } from '@/infrastructure/repositories/OrganizationRepositoryImpl';
import { MaintenanceRepositoryImpl } from '@/infrastructure/repositories/MaintenanceRepositoryImpl';
import { ServiceRepositoryImpl } from '@/infrastructure/repositories/ServiceRepositoryImpl';

const organizationRepository = new OrganizationRepositoryImpl();
const maintenanceRepository = new MaintenanceRepositoryImpl();
const serviceRepository = new ServiceRepositoryImpl();

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string; maintenanceId: string } }
) {
  try {
    const { slug, maintenanceId } = params;

    const organization = await organizationRepository.findBySlug(slug);

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const maintenance = await maintenanceRepository.findById(maintenanceId);

    if (!maintenance || maintenance.organizationId !== organization.id) {
      return NextResponse.json(
        { error: 'Maintenance not found' },
        { status: 404 }
      );
    }

    // Get affected services
    const services = await serviceRepository.findByMaintenanceId(maintenanceId);

    // Return only public information
    return NextResponse.json({
      maintenance: {
        id: maintenance.id,
        title: maintenance.title,
        description: maintenance.description,
        status: maintenance.status,
        scheduledStartTime: maintenance.scheduledStartTime,
        scheduledEndTime: maintenance.scheduledEndTime,
        actualStartTime: maintenance.actualStartTime,
        actualEndTime: maintenance.actualEndTime,
        createdAt: maintenance.createdAt,
        updatedAt: maintenance.updatedAt,
      },
      affectedServices: services.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description,
        status: service.status,
      })),
    });
  } catch (error) {
    console.error('Error fetching public maintenance details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 