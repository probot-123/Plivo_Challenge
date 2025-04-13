import { UserRole } from "@/lib/auth";

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export class TeamMemberEntity implements TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;

  constructor(params: TeamMember) {
    this.id = params.id;
    this.userId = params.userId;
    this.teamId = params.teamId;
    this.role = params.role;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }

  static create(params: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt' | 'role'> & { role?: UserRole }): TeamMemberEntity {
    const now = new Date();
    return new TeamMemberEntity({
      id: crypto.randomUUID(),
      role: 'member',
      ...params,
      createdAt: now,
      updatedAt: now,
    });
  }

  updateRole(role: UserRole): TeamMemberEntity {
    this.role = role;
    this.updatedAt = new Date();
    return this;
  }
} 