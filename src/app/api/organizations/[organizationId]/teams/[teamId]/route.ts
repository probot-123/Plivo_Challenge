import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { TeamRepositoryImpl } from "@/infrastructure/repositories/TeamRepositoryImpl";
import { OrganizationRepositoryImpl } from "@/infrastructure/repositories/OrganizationRepositoryImpl";
import { z } from "zod";

const teamRepository = new TeamRepositoryImpl();
const organizationRepository = new OrganizationRepositoryImpl();

// Validation schema for updating a team
const updateTeamSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

// Get a single team
export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string; teamId: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId, teamId } = params;
    
    if (!organizationId || !teamId) {
      return NextResponse.json(
        { error: "Organization ID and Team ID are required" },
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

    // Get the team
    const team = await teamRepository.findById(teamId);
    
    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Ensure the team belongs to the organization
    if (team.organizationId !== organizationId) {
      return NextResponse.json(
        { error: "Team does not belong to the organization" },
        { status: 403 }
      );
    }

    return NextResponse.json(team);
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { error: "Failed to fetch team" },
      { status: 500 }
    );
  }
}

// Update a team
export async function PATCH(
  request: NextRequest,
  { params }: { params: { organizationId: string; teamId: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId, teamId } = params;
    
    if (!organizationId || !teamId) {
      return NextResponse.json(
        { error: "Organization ID and Team ID are required" },
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

    // Get the team
    const team = await teamRepository.findById(teamId);
    
    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Ensure the team belongs to the organization
    if (team.organizationId !== organizationId) {
      return NextResponse.json(
        { error: "Team does not belong to the organization" },
        { status: 403 }
      );
    }

    // Parse and validate the request body
    const body = await request.json();
    const validationResult = updateTeamSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { name } = validationResult.data;

    // Update the team
    team.update({ name });
    const updatedTeam = await teamRepository.update(team);

    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 500 }
    );
  }
}

// Delete a team
export async function DELETE(
  request: NextRequest,
  { params }: { params: { organizationId: string; teamId: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId, teamId } = params;
    
    if (!organizationId || !teamId) {
      return NextResponse.json(
        { error: "Organization ID and Team ID are required" },
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

    // Get the team
    const team = await teamRepository.findById(teamId);
    
    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Ensure the team belongs to the organization
    if (team.organizationId !== organizationId) {
      return NextResponse.json(
        { error: "Team does not belong to the organization" },
        { status: 403 }
      );
    }

    // Delete the team
    await teamRepository.delete(teamId);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 }
    );
  }
} 