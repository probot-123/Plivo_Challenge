import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { MaintenanceRepositoryImpl } from "@/infrastructure/repositories/MaintenanceRepositoryImpl";
import { OrganizationRepositoryImpl } from "@/infrastructure/repositories/OrganizationRepositoryImpl";
import { CommentRepositoryImpl } from "@/infrastructure/repositories/CommentRepositoryImpl";
import { z } from "zod";

const maintenanceRepository = new MaintenanceRepositoryImpl();
const organizationRepository = new OrganizationRepositoryImpl();
const commentRepository = new CommentRepositoryImpl();

// Validation schema for creating a comment
const createCommentSchema = z.object({
  content: z.string().min(1, "Comment content is required").max(1000, "Comment too long"),
});

// Validation schema for updating a comment
const updateCommentSchema = z.object({
  content: z.string().min(1, "Comment content is required").max(1000, "Comment too long"),
  commentId: z.string().uuid(),
});

// Get all comments for a maintenance
export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string; maintenanceId: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId, maintenanceId } = params;
    
    if (!organizationId || !maintenanceId) {
      return NextResponse.json(
        { error: "Organization ID and Maintenance ID are required" },
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

    // Get the maintenance
    const maintenance = await maintenanceRepository.findById(maintenanceId);
    
    if (!maintenance) {
      return NextResponse.json(
        { error: "Maintenance not found" },
        { status: 404 }
      );
    }

    // Check if the maintenance belongs to the organization
    if (maintenance.organizationId !== organizationId) {
      return NextResponse.json(
        { error: "Maintenance does not belong to this organization" },
        { status: 403 }
      );
    }

    // Get comments for the maintenance
    const comments = await commentRepository.getCommentsForMaintenance(maintenanceId);

    return NextResponse.json({
      comments: comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        userId: comment.userId,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching maintenance comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch maintenance comments" },
      { status: 500 }
    );
  }
}

// Add a comment to a maintenance
export async function POST(
  request: NextRequest,
  { params }: { params: { organizationId: string; maintenanceId: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId, maintenanceId } = params;
    
    if (!organizationId || !maintenanceId) {
      return NextResponse.json(
        { error: "Organization ID and Maintenance ID are required" },
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

    // Get the maintenance
    const maintenance = await maintenanceRepository.findById(maintenanceId);
    
    if (!maintenance) {
      return NextResponse.json(
        { error: "Maintenance not found" },
        { status: 404 }
      );
    }

    // Check if the maintenance belongs to the organization
    if (maintenance.organizationId !== organizationId) {
      return NextResponse.json(
        { error: "Maintenance does not belong to this organization" },
        { status: 403 }
      );
    }

    // Parse the request body
    const body = await request.json();
    
    // Validate the request body
    const validationResult = createCommentSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { content } = validationResult.data;

    // Create the comment
    const comment = await commentRepository.createComment({
      content,
      userId,
      maintenanceId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      comment: {
        id: comment.id,
        content: comment.content,
        userId: comment.userId,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Error adding comment to maintenance:", error);
    return NextResponse.json(
      { error: "Failed to add comment to maintenance" },
      { status: 500 }
    );
  }
}

// Update or delete a comment
export async function PATCH(
  request: NextRequest,
  { params }: { params: { organizationId: string; maintenanceId: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId, maintenanceId } = params;
    
    if (!organizationId || !maintenanceId) {
      return NextResponse.json(
        { error: "Organization ID and Maintenance ID are required" },
        { status: 400 }
      );
    }

    // Parse the request body
    const body = await request.json();
    
    // Validate the request body
    const validationResult = updateCommentSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { content, commentId } = validationResult.data;

    // Get the comment
    const comment = await commentRepository.findById(commentId);
    
    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Check if the comment belongs to the maintenance
    if (comment.maintenanceId !== maintenanceId) {
      return NextResponse.json(
        { error: "Comment does not belong to this maintenance" },
        { status: 403 }
      );
    }

    // Check if the user is the owner of the comment
    if (comment.userId !== userId) {
      return NextResponse.json(
        { error: "You can only update your own comments" },
        { status: 403 }
      );
    }

    // Update the comment
    const updatedComment = await commentRepository.updateComment(commentId, {
      content,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      comment: {
        id: updatedComment.id,
        content: updatedComment.content,
        userId: updatedComment.userId,
        createdAt: updatedComment.createdAt,
        updatedAt: updatedComment.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json(
      { error: "Failed to update comment" },
      { status: 500 }
    );
  }
}

// Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { organizationId: string; maintenanceId: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId, maintenanceId } = params;
    
    if (!organizationId || !maintenanceId) {
      return NextResponse.json(
        { error: "Organization ID and Maintenance ID are required" },
        { status: 400 }
      );
    }

    // Get the URL parameters
    const url = new URL(request.url);
    const commentId = url.searchParams.get("commentId");
    
    if (!commentId) {
      return NextResponse.json(
        { error: "Comment ID is required" },
        { status: 400 }
      );
    }

    // Get the comment
    const comment = await commentRepository.findById(commentId);
    
    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Check if the comment belongs to the maintenance
    if (comment.maintenanceId !== maintenanceId) {
      return NextResponse.json(
        { error: "Comment does not belong to this maintenance" },
        { status: 403 }
      );
    }

    // Check if the user is the owner of the comment
    if (comment.userId !== userId) {
      return NextResponse.json(
        { error: "You can only delete your own comments" },
        { status: 403 }
      );
    }

    // Delete the comment
    await commentRepository.deleteComment(commentId);

    return NextResponse.json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
} 