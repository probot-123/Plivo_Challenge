import { NextRequest, NextResponse } from 'next/server';
import { OrganizationRepositoryImpl } from '@/infrastructure/repositories/OrganizationRepositoryImpl';
import { MaintenanceRepositoryImpl } from '@/infrastructure/repositories/MaintenanceRepositoryImpl';
import { ServiceRepositoryImpl } from '@/infrastructure/repositories/ServiceRepositoryImpl';

const organizationRepository = new OrganizationRepositoryImpl();
const maintenanceRepository = new MaintenanceRepositoryImpl();
const serviceRepository = new ServiceRepositoryImpl();

export async function GET(
  request: Request,
  { params }: { params: { slug: string; maintenanceId: string } }
) {
  const { slug, maintenanceId } = params;

  // Mock data response
  return new Response(
    JSON.stringify({
      services: [
        {
          id: '1',
          name: 'API Service',
          description: 'Main API for the application',
          status: 'operational',
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Web Dashboard',
          description: 'User dashboard interface',
          status: 'degraded',
          updatedAt: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Database',
          description: 'Database service',
          status: 'operational',
          updatedAt: new Date().toISOString()
        }
      ],
      meta: {
        total: 3,
        maintenanceId: maintenanceId,
        maintenanceTitle: 'Scheduled Database Maintenance',
        organizationSlug: slug
      }
    }),
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
} 