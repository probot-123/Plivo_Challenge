import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { TeamRepositoryImpl } from "@/infrastructure/repositories/TeamRepositoryImpl";
import { OrganizationRepositoryImpl } from "@/infrastructure/repositories/OrganizationRepositoryImpl";
import { TeamEntity } from "@/domain/entities/Team";
import { z } from "zod";

const teamRepository = new TeamRepositoryImpl();
const organizationRepository = new OrganizationRepositoryImpl();

// Validation schema for creating a team
const createTeamSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Team:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The team's unique identifier
 *         name:
 *           type: string
 *           description: The team name
 *         description:
 *           type: string
 *           description: Description of the team
 *         organizationId:
 *           type: string
 *           format: uuid
 *           description: ID of the organization this team belongs to
 *         createdById:
 *           type: string
 *           description: ID of the user who created the team
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the team was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the team was last updated
 *       required:
 *         - name
 *         - organizationId
 *
 *     TeamResponse:
 *       type: object
 *       properties:
 *         team:
 *           $ref: '#/components/schemas/Team'
 *
 *     TeamsResponse:
 *       type: object
 *       properties:
 *         teams:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Team'
 *         pagination:
 *           $ref: '#/components/schemas/PaginationResponse'
 */

/**
 * @swagger
 * /api/organizations/{organizationId}/teams:
 *   get:
 *     summary: Get all teams in an organization
 *     tags: [Teams]
 *     description: Retrieve a list of all teams in an organization
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
 *         description: List of teams
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeamsResponse'
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
 *     summary: Create a new team
 *     tags: [Teams]
 *     description: Create a new team in an organization
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
 *                 description: The team name
 *               description:
 *                 type: string
 *                 description: Description of the team
 *             required:
 *               - name
 *     responses:
 *       201:
 *         description: Team created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeamResponse'
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

// Get all teams for an organization
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

    // Get the teams for the organization
    const { data, total } = await teamRepository.findByOrganizationId(organizationId, page, limit);

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
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}

// Create a new team for an organization
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
    const validationResult = createTeamSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { name } = validationResult.data;

    // Create the team
    const team = TeamEntity.create({
      name,
      organizationId,
    });

    const createdTeam = await teamRepository.create(team);

    return NextResponse.json(createdTeam, { status: 201 });
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
} 