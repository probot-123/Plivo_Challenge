import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { OrganizationRepositoryImpl } from "@/infrastructure/repositories/OrganizationRepositoryImpl";
import { OrganizationEntity } from "@/domain/entities/Organization";
import { z } from "zod";

const organizationRepository = new OrganizationRepositoryImpl();

// Validation schema for creating/updating an organization
const organizationSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z.string().min(1, "Slug is required").max(100)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  logoUrl: z.string().url().optional().nullable(),
});

// Create a new organization
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate the request body
    const body = await request.json();
    const validationResult = organizationSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { name, slug, logoUrl } = validationResult.data;

    // Check if an organization with the same slug already exists
    const existingOrg = await organizationRepository.findBySlug(slug);
    if (existingOrg) {
      return NextResponse.json(
        { error: "An organization with this slug already exists" },
        { status: 409 }
      );
    }

    // Create the organization
    const organization = OrganizationEntity.create({
      name,
      slug,
      logoUrl,
    });

    const createdOrganization = await organizationRepository.create(organization);

    return NextResponse.json(createdOrganization, { status: 201 });
  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
}

// Get all organizations (with pagination)
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const { data, total } = await organizationRepository.list(page, limit);

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
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Organization:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The organization's unique identifier
 *         name:
 *           type: string
 *           description: The organization name
 *         slug:
 *           type: string
 *           description: URL-friendly identifier for the organization
 *         description:
 *           type: string
 *           description: Description of the organization
 *         website:
 *           type: string
 *           description: Organization's website URL
 *         logoUrl:
 *           type: string
 *           description: URL to the organization's logo
 *         createdById:
 *           type: string
 *           description: ID of the user who created the organization
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the organization was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the organization was last updated
 *       required:
 *         - name
 *         - slug
 *
 *     OrganizationResponse:
 *       type: object
 *       properties:
 *         organization:
 *           $ref: '#/components/schemas/Organization'
 *
 *     OrganizationsResponse:
 *       type: object
 *       properties:
 *         organizations:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Organization'
 *         pagination:
 *           $ref: '#/components/schemas/PaginationResponse'
 */

/**
 * @swagger
 * /api/organizations:
 *   get:
 *     summary: Get all organizations
 *     tags: [Organizations]
 *     description: Retrieve a list of all organizations accessible to the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: List of organizations
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrganizationsResponse'
 *       401:
 *         description: Unauthorized
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
 *     summary: Create a new organization
 *     tags: [Organizations]
 *     description: Create a new organization with the authenticated user as the owner
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The organization name
 *               slug:
 *                 type: string
 *                 description: URL-friendly identifier for the organization
 *               description:
 *                 type: string
 *                 description: Description of the organization
 *               website:
 *                 type: string
 *                 description: Organization's website URL
 *               logoUrl:
 *                 type: string
 *                 description: URL to the organization's logo
 *             required:
 *               - name
 *               - slug
 *     responses:
 *       201:
 *         description: Organization created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrganizationResponse'
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
 *       409:
 *         description: Conflict - Organization with the same slug already exists
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