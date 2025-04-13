import { db } from "../db/connection";
import { teams, teamMembers } from "../db/schema";
import { TeamRepository } from "@/domain/repositories/TeamRepository";
import { TeamEntity } from "@/domain/entities/Team";
import { TeamMemberEntity } from "@/domain/entities/TeamMember";
import { eq, and, sql } from "drizzle-orm";
import { UserRole } from "@/lib/auth";

export class TeamRepositoryImpl implements TeamRepository {
  async create(team: TeamEntity): Promise<TeamEntity> {
    const created = await db.insert(teams)
      .values({
        id: team.id,
        name: team.name,
        organizationId: team.organizationId,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      })
      .returning();

    return new TeamEntity(created[0]);
  }

  async findById(id: string): Promise<TeamEntity | null> {
    const result = await db.select()
      .from(teams)
      .where(eq(teams.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return new TeamEntity(result[0]);
  }

  async findByOrganizationId(organizationId: string, page: number = 1, limit: number = 10): Promise<{ data: TeamEntity[]; total: number }> {
    const offset = (page - 1) * limit;

    const data = await db.select()
      .from(teams)
      .where(eq(teams.organizationId, organizationId))
      .limit(limit)
      .offset(offset)
      .orderBy(teams.createdAt);

    const [{ count }] = await db.select({
      count: sql<number>`count(*)`
    })
    .from(teams)
    .where(eq(teams.organizationId, organizationId));

    return {
      data: data.map(team => new TeamEntity(team)),
      total: count,
    };
  }

  async update(team: TeamEntity): Promise<TeamEntity> {
    const updated = await db.update(teams)
      .set({
        name: team.name,
        updatedAt: team.updatedAt,
      })
      .where(eq(teams.id, team.id))
      .returning();

    return new TeamEntity(updated[0]);
  }

  async delete(id: string): Promise<void> {
    await db.delete(teams)
      .where(eq(teams.id, id));
  }

  // Team members
  async addMember(member: TeamMemberEntity): Promise<TeamMemberEntity> {
    const created = await db.insert(teamMembers)
      .values({
        id: member.id,
        userId: member.userId,
        teamId: member.teamId,
        role: member.role,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
      })
      .returning();

    return new TeamMemberEntity(created[0]);
  }

  async removeMember(teamId: string, userId: string): Promise<void> {
    await db.delete(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, userId)
        )
      );
  }

  async updateMemberRole(teamId: string, userId: string, role: string): Promise<TeamMemberEntity> {
    const updated = await db.update(teamMembers)
      .set({
        role: role as UserRole,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, userId)
        )
      )
      .returning();

    return new TeamMemberEntity(updated[0]);
  }

  async findMembers(teamId: string, page: number = 1, limit: number = 10): Promise<{ data: TeamMemberEntity[]; total: number }> {
    const offset = (page - 1) * limit;

    const data = await db.select()
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamId))
      .limit(limit)
      .offset(offset)
      .orderBy(teamMembers.createdAt);

    const [{ count }] = await db.select({
      count: sql<number>`count(*)`
    })
    .from(teamMembers)
    .where(eq(teamMembers.teamId, teamId));

    return {
      data: data.map(member => new TeamMemberEntity(member)),
      total: count,
    };
  }

  async findMemberById(teamId: string, userId: string): Promise<TeamMemberEntity | null> {
    const result = await db.select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, userId)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return new TeamMemberEntity(result[0]);
  }
} 