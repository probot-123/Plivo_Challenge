export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class OrganizationEntity implements Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(params: Organization) {
    this.id = params.id;
    this.name = params.name;
    this.slug = params.slug;
    this.logoUrl = params.logoUrl;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }

  static create(params: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): OrganizationEntity {
    const now = new Date();
    return new OrganizationEntity({
      id: crypto.randomUUID(),
      ...params,
      createdAt: now,
      updatedAt: now,
    });
  }

  update(params: Partial<Omit<Organization, 'id' | 'createdAt'>>) {
    if (params.name) this.name = params.name;
    if (params.slug) this.slug = params.slug;
    if (params.logoUrl !== undefined) this.logoUrl = params.logoUrl;
    this.updatedAt = new Date();
    return this;
  }
} 