import { Organization, OrganizationEntity } from "../entities/Organization";

export interface OrganizationRepository {
  create(organization: OrganizationEntity): Promise<OrganizationEntity>;
  findById(id: string): Promise<OrganizationEntity | null>;
  findBySlug(slug: string): Promise<OrganizationEntity | null>;
  update(organization: OrganizationEntity): Promise<OrganizationEntity>;
  delete(id: string): Promise<void>;
  list(page?: number, limit?: number): Promise<{ data: OrganizationEntity[], total: number }>;
} 