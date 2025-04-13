import { NextRequest, NextResponse } from 'next/server';
import { OrganizationRepositoryImpl } from '@/infrastructure/repositories/OrganizationRepositoryImpl';
import { ServiceRepositoryImpl } from '@/infrastructure/repositories/ServiceRepositoryImpl';
import { IncidentRepositoryImpl } from '@/infrastructure/repositories/IncidentRepositoryImpl';
import { MaintenanceRepositoryImpl } from '@/infrastructure/repositories/MaintenanceRepositoryImpl';

const organizationRepository = new OrganizationRepositoryImpl();
const serviceRepository = new ServiceRepositoryImpl();
const incidentRepository = new IncidentRepositoryImpl();
const maintenanceRepository = new MaintenanceRepositoryImpl();

/**
 * @swagger
 * /api/public/organizations/{slug}/status:
 *   get:
 *     summary: Get organization status overview
 *     tags: [Public]
 *     description: |
 *       Retrieve a comprehensive status overview for a public organization.
 *       This endpoint provides the current status of all services, active incidents,
 *       and upcoming maintenances for the specified organization.
 *       No authentication is required.
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: The organization's unique slug
 *     responses:
 *       200:
 *         description: Organization status overview
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 organization:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: The organization name
 *                     slug:
 *                       type: string
 *                       description: The organization slug
 *                 status:
 *                   type: object
 *                   properties:
 *                     overall:
 *                       type: string
 *                       enum: [operational, degraded_performance, partial_outage, major_outage]
 *                       description: Overall status of all services
 *                     services:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                           status:
 *                             type: string
 *                             enum: [operational, degraded_performance, partial_outage, major_outage]
 *                 activeIncidents:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       title:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [investigating, identified, monitoring, resolved]
 *                       severity:
 *                         type: string
 *                         enum: [minor, major, critical]
 *                       startedAt:
 *                         type: string
 *                         format: date-time
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                 upcomingMaintenances:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       title:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [scheduled, in_progress, completed]
 *                       scheduledStartTime:
 *                         type: string
 *                         format: date-time
 *                       scheduledEndTime:
 *                         type: string
 *                         format: date-time
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       404:
 *         description: Organization not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const organization = await organizationRepository.findBySlug(slug);

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get all services
    const services = await serviceRepository.findByOrganizationId(
      organization.id,
      {}
    );

    // Get active incidents
    const activeIncidents = await incidentRepository.findByOrganizationId(
      organization.id,
      { status: 'active', limit: 5 }
    );

    // Get upcoming and in-progress maintenances
    const maintenances = await maintenanceRepository.findByOrganizationId(
      organization.id,
      { status: 'active', limit: 5 }
    );

    // Calculate overall system status based on service statuses
    const hasOperationalServices = services.items.some(service => service.status === 'operational');
    const hasDegradedServices = services.items.some(service => service.status === 'degraded_performance');
    const hasPartialOutageServices = services.items.some(service => service.status === 'partial_outage');
    const hasMajorOutageServices = services.items.some(service => service.status === 'major_outage');

    let overallStatus = 'operational';
    if (hasMajorOutageServices) {
      overallStatus = 'major_outage';
    } else if (hasPartialOutageServices) {
      overallStatus = 'partial_outage';
    } else if (hasDegradedServices) {
      overallStatus = 'degraded_performance';
    }

    return NextResponse.json({
      organization: {
        name: organization.name,
        slug: organization.slug,
      },
      status: {
        overall: overallStatus,
        services: services.items.map(service => ({
          id: service.id,
          name: service.name,
          description: service.description,
          status: service.status,
        })),
      },
      activeIncidents: activeIncidents.items.map(incident => ({
        id: incident.id,
        title: incident.title,
        status: incident.status,
        severity: incident.severity,
        startedAt: incident.startedAt,
        createdAt: incident.createdAt,
        updatedAt: incident.updatedAt,
      })),
      upcomingMaintenances: maintenances.items.map(maintenance => ({
        id: maintenance.id,
        title: maintenance.title,
        status: maintenance.status,
        scheduledStartTime: maintenance.scheduledStartTime,
        scheduledEndTime: maintenance.scheduledEndTime,
        createdAt: maintenance.createdAt,
        updatedAt: maintenance.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching public status overview:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 