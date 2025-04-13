import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { MaintenanceRepositoryImpl } from "@/infrastructure/repositories/MaintenanceRepositoryImpl";
import { OrganizationRepositoryImpl } from "@/infrastructure/repositories/OrganizationRepositoryImpl";
import { ServiceRepositoryImpl } from "@/infrastructure/repositories/ServiceRepositoryImpl";
import { MaintenanceEntity, MaintenanceStatus } from "@/domain/entities/Maintenance";
import { z } from "zod";

const maintenanceRepository = new MaintenanceRepositoryImpl();
const organizationRepository = new OrganizationRepositoryImpl();
const serviceRepository = new ServiceRepositoryImpl();

// Validation schema for creating a maintenance
const createMaintenanceSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  scheduledStartTime: z.string().transform(val => new Date(val)),
  scheduledEndTime: z.string().transform(val => new Date(val)),
  serviceIds: z.array(z.string().uuid()).optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed']).optional(),
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Maintenance:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The maintenance's unique identifier
 *         title:
 *           type: string
 *           description: The maintenance title
 *         description:
 *           type: string
 *           description: Detailed description of the maintenance
 *         status:
 *           type: string
 *           enum: [scheduled, in_progress, completed]
 *           description: Current status of the maintenance
 *         organizationId:
 *           type: string
 *           format: uuid
 *           description: ID of the organization this maintenance belongs to
 *         createdById:
 *           type: string
 *           description: ID of the user who created the maintenance
 *         scheduledStartTime:
 *           type: string
 *           format: date-time
 *           description: When the maintenance is scheduled to start
 *         scheduledEndTime:
 *           type: string
 *           format: date-time
 *           description: When the maintenance is scheduled to end
 *         actualStartTime:
 *           type: string
 *           format: date-time
 *           description: When the maintenance actually started (if in progress or completed)
 *         actualEndTime:
 *           type: string
 *           format: date-time
 *           description: When the maintenance actually ended (if completed)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the maintenance was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the maintenance was last updated
 *       required:
 *         - title
 *         - status
 *         - organizationId
 *         - scheduledStartTime
 *         - scheduledEndTime
 *
 *     MaintenanceResponse:
 *       type: object
 *       properties:
 *         maintenance:
 *           $ref: '#/components/schemas/Maintenance'
 *
 *     MaintenancesResponse:
 *       type: object
 *       properties:
 *         maintenances:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Maintenance'
 *         pagination:
 *           $ref: '#/components/schemas/PaginationResponse'
 */

/**
 * @swagger
 * /api/organizations/{organizationId}/maintenances:
 *   get:
 *     summary: Get all maintenances in an organization
 *     tags: [Maintenances]
 *     description: Retrieve a list of all scheduled maintenances in an organization
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
 *           enum: [scheduled, in_progress, completed, active]
 *         description: Filter maintenances by status ('active' means scheduled or in progress)
 *       - in: query
 *         name: upcoming
 *         schema:
 *           type: boolean
 *         description: If true, only return scheduled maintenances in the future
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter maintenances by start date (from this date)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter maintenances by end date (until this date)
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
 *         description: List of maintenances
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MaintenancesResponse'
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
 *     summary: Create a new maintenance
 *     tags: [Maintenances]
 *     description: Schedule a new maintenance for an organization
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
 *                 description: The maintenance title
 *               description:
 *                 type: string
 *                 description: Detailed description of the maintenance
 *               status:
 *                 type: string
 *                 enum: [scheduled, in_progress, completed]
 *                 default: scheduled
 *                 description: Initial status of the maintenance
 *               scheduledStartTime:
 *                 type: string
 *                 format: date-time
 *                 description: When the maintenance is scheduled to start
 *               scheduledEndTime:
 *                 type: string
 *                 format: date-time
 *                 description: When the maintenance is scheduled to end
 *               serviceIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: IDs of affected services
 *             required:
 *               - title
 *               - scheduledStartTime
 *               - scheduledEndTime
 *     responses:
 *       201:
 *         description: Maintenance created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MaintenanceResponse'
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

// Get all maintenances for an organization
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
    const status = url.searchParams.get("status") as MaintenanceStatus | 'active' | null;
    const upcoming = url.searchParams.get("upcoming") === "true";
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

    // Validate date parameters
    if (startDate && isNaN(startDate.getTime()) || endDate && isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date parameters" },
        { status: 400 }
      );
    }

    const filter = {
      status,
      upcoming,
      page,
      limit,
      startDate,
      endDate,
    };

    // Get maintenances
    const { data, total } = await maintenanceRepository.findByOrganizationId(organizationId, filter);

    // Get services for each maintenance
    const maintenancesWithServices = await Promise.all(
      data.map(async (maintenance) => {
        const serviceIds = await maintenanceRepository.getServicesForMaintenance(maintenance.id);
        const services = await serviceRepository.getServicesByIds(serviceIds);
        return {
          ...maintenance,
          services: services.map(service => ({
            id: service.id,
            name: service.name,
            status: service.status,
          })),
        };
      })
    );

    return NextResponse.json({
      data: maintenancesWithServices,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching maintenances:", error);
    return NextResponse.json(
      { error: "Failed to fetch maintenances" },
      { status: 500 }
    );
  }
}

// Create a new maintenance
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
    const validationResult = createMaintenanceSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { title, description, scheduledStartTime, scheduledEndTime, serviceIds, status } = validationResult.data;

    // Validate time range
    if (scheduledStartTime >= scheduledEndTime) {
      return NextResponse.json(
        { error: "Scheduled end time must be after scheduled start time" },
        { status: 400 }
      );
    }

    // Create the maintenance
    const maintenance = MaintenanceEntity.create({
      title,
      description,
      scheduledStartTime,
      scheduledEndTime,
      organizationId,
      createdById: userId,
      status: status, // Optional parameter, defaults to 'scheduled'
    });

    const createdMaintenance = await maintenanceRepository.create(maintenance);

    // Add services to the maintenance
    if (serviceIds && serviceIds.length > 0) {
      await Promise.all(
        serviceIds.map(serviceId => 
          maintenanceRepository.addServiceToMaintenance(createdMaintenance.id, serviceId)
        )
      );
    }

    // Get the services for the maintenance
    const services = serviceIds && serviceIds.length > 0
      ? await serviceRepository.getServicesByIds(serviceIds)
      : [];

    return NextResponse.json({
      ...createdMaintenance,
      services: services.map(service => ({
        id: service.id,
        name: service.name,
        status: service.status,
      })),
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating maintenance:", error);
    return NextResponse.json(
      { error: "Failed to create maintenance" },
      { status: 500 }
    );
  }
} 