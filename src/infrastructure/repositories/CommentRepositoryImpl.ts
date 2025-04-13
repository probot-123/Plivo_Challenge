import { Comment, CommentEntity } from "../../domain/entities/Comment";
import { CommentRepository } from "../../domain/repositories/CommentRepository";
import { db } from "../db/connection";
import { comments } from "../db/schema";
import { emitToOrganization, SocketEventType } from '@/lib/socketServer';
import { eq } from "drizzle-orm";
import { IncidentRepositoryImpl } from "./IncidentRepositoryImpl";
import { MaintenanceRepositoryImpl } from "./MaintenanceRepositoryImpl";

export class CommentRepositoryImpl implements CommentRepository {
  
  async findById(id: string): Promise<Comment | null> {
    const result = await db.select()
      .from(comments)
      .where(eq(comments.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return new CommentEntity({
      id: result[0].id,
      content: result[0].content,
      userId: result[0].userId,
      maintenanceId: result[0].maintenanceId!,
      createdAt: result[0].createdAt,
      updatedAt: result[0].updatedAt
    });
  }

  async findByMaintenanceId(maintenanceId: string): Promise<Comment[]> {
    const result = await db.select()
      .from(comments)
      .where(eq(comments.maintenanceId, maintenanceId))
      .orderBy(comments.createdAt);

    return result.map(comment => new CommentEntity({
      id: comment.id,
      content: comment.content,
      userId: comment.userId,
      maintenanceId: comment.maintenanceId!,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt
    }));
  }

  async create(comment: CommentEntity): Promise<CommentEntity> {
    const created = await db.insert(comments)
      .values({
        id: comment.id,
        content: comment.content,
        userId: comment.userId,
        maintenanceId: comment.maintenanceId,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt
      })
      .returning();

    const createdComment = new CommentEntity({
      id: created[0].id,
      content: created[0].content,
      userId: created[0].userId,
      maintenanceId: created[0].maintenanceId!,
      createdAt: created[0].createdAt,
      updatedAt: created[0].updatedAt
    });

    // Find the entity (incident or maintenance) to get its title
    let entityTitle = '';
    let entityId = '';
    let entityType = '';
    let organizationId = '';
    
    if (createdComment.maintenanceId) {
      entityId = createdComment.maintenanceId;
      entityType = 'maintenance';
      const maintenanceRepo = new MaintenanceRepositoryImpl();
      const maintenance = await maintenanceRepo.findById(entityId);
      if (maintenance) {
        entityTitle = maintenance.title;
        organizationId = maintenance.organizationId;
      }
    }

    // Emit WebSocket event for comment creation
    if (organizationId) {
      emitToOrganization(
        organizationId,
        SocketEventType.COMMENT_CREATE,
        {
          commentId: createdComment.id,
          content: createdComment.content,
          entityId,
          entityType,
          entityTitle,
          createdAt: createdComment.createdAt
        }
      );
    }

    return createdComment;
  }

  async update(comment: Comment): Promise<Comment> {
    const updated = await db.update(comments)
      .set({
        content: comment.content,
        updatedAt: new Date()
      })
      .where(eq(comments.id, comment.id))
      .returning();

    return new CommentEntity({
      id: updated[0].id,
      content: updated[0].content,
      userId: updated[0].userId,
      maintenanceId: updated[0].maintenanceId!,
      createdAt: updated[0].createdAt,
      updatedAt: updated[0].updatedAt
    });
  }

  async delete(id: string): Promise<void> {
    await db.delete(comments)
      .where(eq(comments.id, id));
  }
} 