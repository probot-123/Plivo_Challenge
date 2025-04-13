import { db } from "../db/connection";
import { organizations } from "../db/schema";
import { OrganizationRepository } from "@/domain/repositories/OrganizationRepository";
import { OrganizationEntity } from "@/domain/entities/Organization";
import { eq, sql } from "drizzle-orm";

export class OrganizationRepositoryImpl implements OrganizationRepository {
  async create(organization: OrganizationEntity): Promise<OrganizationEntity> {
    const created = await db.insert(organizations)
      .values({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logoUrl: organization.logoUrl,
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt,
      })
      .returning();

    return new OrganizationEntity(created[0]);
  }

  async findById(id: string): Promise<OrganizationEntity | null> {
    const result = await db.select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return new OrganizationEntity(result[0]);
  }

  async findBySlug(slug: string): Promise<OrganizationEntity | null> {
    const result = await db.select()
      .from(organizations)
      .where(eq(organizations.slug, slug))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return new OrganizationEntity(result[0]);
  }

  async update(organization: OrganizationEntity): Promise<OrganizationEntity> {
    const updated = await db.update(organizations)
      .set({
        name: organization.name,
        slug: organization.slug,
        logoUrl: organization.logoUrl,
        updatedAt: organization.updatedAt,
      })
      .where(eq(organizations.id, organization.id))
      .returning();

    return new OrganizationEntity(updated[0]);
  }

  async delete(id: string): Promise<void> {
    await db.delete(organizations)
      .where(eq(organizations.id, id));
  }

  async list(page: number = 1, limit: number = 10): Promise<{ data: OrganizationEntity[]; total: number }> {
    const offset = (page - 1) * limit;

    const data = await db.select()
      .from(organizations)
      .limit(limit)
      .offset(offset)
      .orderBy(organizations.createdAt);

    const [{ count }] = await db.select({
      count: sql<number>`count(*)`
    })
    .from(organizations);

    return {
      data: data.map(org => new OrganizationEntity(org)),
      total: count,
    };
  }
} 