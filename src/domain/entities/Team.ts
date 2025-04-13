export interface Team {
  id: string;
  name: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class TeamEntity implements Team {
  id: string;
  name: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(params: Team) {
    this.id = params.id;
    this.name = params.name;
    this.organizationId = params.organizationId;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }

  static create(params: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): TeamEntity {
    const now = new Date();
    return new TeamEntity({
      id: crypto.randomUUID(),
      ...params,
      createdAt: now,
      updatedAt: now,
    });
  }

  update(params: Partial<Pick<Team, 'name'>>): TeamEntity {
    if (params.name) this.name = params.name;
    this.updatedAt = new Date();
    return this;
  }
} 