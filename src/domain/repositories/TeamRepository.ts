import { TeamEntity } from "../entities/Team";
import { TeamMemberEntity } from "../entities/TeamMember";

export interface TeamRepository {
  create(team: TeamEntity): Promise<TeamEntity>;
  findById(id: string): Promise<TeamEntity | null>;
  findByOrganizationId(organizationId: string, page?: number, limit?: number): Promise<{ data: TeamEntity[], total: number }>;
  update(team: TeamEntity): Promise<TeamEntity>;
  delete(id: string): Promise<void>;
  
  // Team members
  addMember(teamMember: TeamMemberEntity): Promise<TeamMemberEntity>;
  removeMember(teamId: string, userId: string): Promise<void>;
  updateMemberRole(teamId: string, userId: string, role: string): Promise<TeamMemberEntity>;
  findMembers(teamId: string, page?: number, limit?: number): Promise<{ data: TeamMemberEntity[], total: number }>;
  findMemberById(teamId: string, userId: string): Promise<TeamMemberEntity | null>;
} 