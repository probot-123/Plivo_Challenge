import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { IncidentRepositoryImpl } from "@/infrastructure/repositories/IncidentRepositoryImpl";
import { OrganizationRepositoryImpl } from "@/infrastructure/repositories/OrganizationRepositoryImpl";
import { ServiceRepositoryImpl } from "@/infrastructure/repositories/ServiceRepositoryImpl";
import { IncidentEntity, IncidentStatus } from "@/domain/entities/Incident";
import { ServiceStatus } from "@/domain/entities/Service";
import { z } from "zod";

const incidentRepository = new IncidentRepositoryImpl();
const organizationRepository = new OrganizationRepositoryImpl();
const serviceRepository = new ServiceRepositoryImpl();

// Validation schema for creating an incident
const createIncidentSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  impact: z.enum(['operational', 'degraded', 'partial_outage', 'major_outage']),
  serviceIds: z.array(z.string().uuid()).optional(),
  status: z.enum(['investigating', 'identified', 'monitoring', 'resolved']).optional(),
  initialUpdate: z.string().optional(),
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Incident:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The incident's unique identifier
 *         title:
 *           type: string
 *           description: The incident title
 *         description:
 *           type: string
 *           description: Detailed description of the incident
 *         status:
 *           type: string
 *           enum: [investigating, identified, monitoring, resolved]
 *           description: Current status of the incident
 *         severity:
 *           type: string
 *           enum: [minor, major, critical]
 *           description: Severity level of the incident
 *         organizationId:
 *           type: string
 *           format: uuid
 *           description: ID of the organization this incident belongs to
 *         createdById:
 *           type: string
 *           description: ID of the user who created the incident
 *         startedAt:
 *           type: string
 *           format: date-time
 *           description: When the incident started
 *         resolvedAt:
 *           type: string
 *           format: date-time
 *           description: When the incident was resolved (if resolved)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the incident was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the incident was last updated
 *       required:
 *         - title
 *         - status
 *         - severity
 *         - organizationId
 *
 *     IncidentResponse:
 *       type: object
 *       properties:
 *         incident:
 *           $ref: '#/components/schemas/Incident'
 *
 *     IncidentsResponse:
 *       type: object
 *       properties:
 *         incidents:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Incident'
 *         pagination:
 *           $ref: '#/components/schemas/PaginationResponse'
 */

/**
 * @swagger
 * /api/organizations/{organizationId}/incidents:
 *   get:
 *     summary: Get all incidents in an organization
 *     tags: [Incidents]
 *     description: Retrieve a list of all incidents in an organization
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The organization ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [investigating, identified, monitoring, resolved, active]
 *         description: Filter incidents by status ('active' means not resolved)
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [minor, major, critical]
 *         description: Filter incidents by severity
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter incidents by start date (from this date)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter incidents by end date (until this date)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of incidents
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IncidentsResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 *
 *   post:
 *     summary: Create a new incident
 *     tags: [Incidents]
 *     description: Create a new incident in an organization
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The organization ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: The incident title
 *               description:
 *                 type: string
 *                 description: Detailed description of the incident
 *               status:
 *                 type: string
 *                 enum: [investigating, identified, monitoring, resolved]
 *                 default: investigating
 *                 description: Initial status of the incident
 *               severity:
 *                 type: string
 *                 enum: [minor, major, critical]
 *                 default: minor
 *                 description: Severity level of the incident
 *               startedAt:
 *                 type: string
 *                 format: date-time
 *                 description: When the incident started (defaults to current time)
 *               serviceIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: IDs of affected services
 *             required:
 *               - title
 *     responses:
 *       201:
 *         description: Incident created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IncidentResponse'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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

// Get all incidents for an organization
export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Get filtering parameters from query
    const url = new URL(request.url);
    const status = url.searchParams.get("status") as IncidentStatus | 'active' | null;
    const page = Number(url.searchParams.get("page") || "1");
    const limit = Number(url.searchParams.get("limit") || "10");
    const startDate = url.searchParams.get("startDate") ? new Date(url.searchParams.get("startDate")!) : undefined;
    const endDate = url.searchParams.get("endDate") ? new Date(url.searchParams.get("endDate")!) : undefined;

    // Validate pagination parameters
    if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      );
    }

    const filter = {
      status,
      page,
      limit,
      startDate,
      endDate,
    };

    // Get incidents
    const { data, total } = await incidentRepository.findByOrganizationId(organizationId, filter);

    // Get services for each incident
    const incidentsWithServices = await Promise.all(
      data.map(async (incident) => {
        const serviceIds = await incidentRepository.getServicesForIncident(incident.id);
        const services = await serviceRepository.getServicesByIds(serviceIds);
        return {
          ...incident,
          services: services.map(service => ({
            id: service.id,
            name: service.name,
            status: service.status,
          })),
        };
      })
    );

    return NextResponse.json({
      data: incidentsWithServices,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching incidents:", error);
    return NextResponse.json(
      { error: "Failed to fetch incidents" },
      { status: 500 }
    );
  }
}

// Create a new incident
export async function POST(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Parse and validate the request body
    const body = await request.json();
    const validationResult = createIncidentSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { title, description, impact, serviceIds, status, initialUpdate } = validationResult.data;

    // Create the incident
    const incident = IncidentEntity.create({
      title,
      description,
      impact: impact as ServiceStatus,
      organizationId,
      createdById: userId,
      status: status, // Optional parameter, defaults to 'investigating'
    });

    const createdIncident = await incidentRepository.create(incident);

    // Add services to the incident
    if (serviceIds && serviceIds.length > 0) {
      await Promise.all(
        serviceIds.map(serviceId => 
          incidentRepository.addServiceToIncident(createdIncident.id, serviceId)
        )
      );

      // Update the status of the affected services
      await Promise.all(
        serviceIds.map(serviceId => 
          serviceRepository.updateStatus(serviceId, impact as ServiceStatus)
        )
      );
    }

    // Add initial update if provided
    if (initialUpdate) {
      await incidentRepository.updateStatus(
        createdIncident.id,
        createdIncident.status,
        initialUpdate,
        userId
      );
    }

    // Get the services for the incident
    const services = serviceIds && serviceIds.length > 0
      ? await serviceRepository.getServicesByIds(serviceIds)
      : [];

    return NextResponse.json({
      ...createdIncident,
      services: services.map(service => ({
        id: service.id,
        name: service.name,
        status: service.status,
      })),
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating incident:", error);
    return NextResponse.json(
      { error: "Failed to create incident" },
      { status: 500 }
    );
  }
} 