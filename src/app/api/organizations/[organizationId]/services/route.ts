import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { ServiceRepositoryImpl } from "@/infrastructure/repositories/ServiceRepositoryImpl";
import { OrganizationRepositoryImpl } from "@/infrastructure/repositories/OrganizationRepositoryImpl";
import { ServiceEntity } from "@/domain/entities/Service";
import { z } from "zod";

const serviceRepository = new ServiceRepositoryImpl();
const organizationRepository = new OrganizationRepositoryImpl();

// Validation schema for creating a service
const createServiceSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
  isPublic: z.boolean().default(true),
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Service:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The service's unique identifier
 *         name:
 *           type: string
 *           description: The service name
 *         description:
 *           type: string
 *           description: Description of the service
 *         status:
 *           type: string
 *           enum: [operational, degraded_performance, partial_outage, major_outage]
 *           description: Current status of the service
 *         organizationId:
 *           type: string
 *           format: uuid
 *           description: ID of the organization this service belongs to
 *         createdById:
 *           type: string
 *           description: ID of the user who created the service
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the service was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the service was last updated
 *       required:
 *         - name
 *         - status
 *         - organizationId
 *
 *     ServiceResponse:
 *       type: object
 *       properties:
 *         service:
 *           $ref: '#/components/schemas/Service'
 *
 *     ServicesResponse:
 *       type: object
 *       properties:
 *         services:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Service'
 *         pagination:
 *           $ref: '#/components/schemas/PaginationResponse'
 */

/**
 * @swagger
 * /api/organizations/{organizationId}/services:
 *   get:
 *     summary: Get all services in an organization
 *     tags: [Services]
 *     description: Retrieve a list of all services in an organization
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
 *           enum: [operational, degraded_performance, partial_outage, major_outage]
 *         description: Filter services by status
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
 *         description: List of services
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServicesResponse'
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
 *     summary: Create a new service
 *     tags: [Services]
 *     description: Create a new service in an organization
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
 *               name:
 *                 type: string
 *                 description: The service name
 *               description:
 *                 type: string
 *                 description: Description of the service
 *               status:
 *                 type: string
 *                 enum: [operational, degraded_performance, partial_outage, major_outage]
 *                 default: operational
 *                 description: Initial status of the service
 *             required:
 *               - name
 *     responses:
 *       201:
 *         description: Service created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServiceResponse'
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

// Get all services for an organization
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

    // Get pagination parameters
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") || "1");
    const limit = Number(url.searchParams.get("limit") || "10");

    // Validate pagination parameters
    if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      );
    }

    // Get the services for the organization
    const { data, total } = await serviceRepository.findByOrganizationId(organizationId, page, limit);

    return NextResponse.json({
      data,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

// Create a new service for an organization
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
    const validationResult = createServiceSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { name, description, isPublic } = validationResult.data;

    // Create the service
    const service = ServiceEntity.create({
      name,
      description,
      organizationId,
      isPublic,
    });

    const createdService = await serviceRepository.create(service);

    return NextResponse.json(createdService, { status: 201 });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
} 