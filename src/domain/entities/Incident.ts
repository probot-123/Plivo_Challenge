import { ServiceStatus } from "./Service";

export type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved';

export interface Incident {
  id: string;
  title: string;
  description?: string;
  status: IncidentStatus;
  impact: ServiceStatus;
  organizationId: string;
  createdById?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export class IncidentEntity implements Incident {
  id: string;
  title: string;
  description?: string;
  status: IncidentStatus;
  impact: ServiceStatus;
  organizationId: string;
  createdById?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;

  constructor(params: Incident) {
    this.id = params.id;
    this.title = params.title;
    this.description = params.description;
    this.status = params.status;
    this.impact = params.impact;
    this.organizationId = params.organizationId;
    this.createdById = params.createdById;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
    this.resolvedAt = params.resolvedAt;
  }

  static create(params: Omit<Incident, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'resolvedAt'> & Partial<Pick<Incident, 'status'>>): IncidentEntity {
    const now = new Date();
    return new IncidentEntity({
      id: crypto.randomUUID(),
      status: 'investigating',
      ...params,
      createdAt: now,
      updatedAt: now,
    });
  }

  update(params: Partial<Pick<Incident, 'title' | 'description' | 'impact'>>): IncidentEntity {
    if (params.title) this.title = params.title;
    if (params.description !== undefined) this.description = params.description;
    if (params.impact) this.impact = params.impact;
    this.updatedAt = new Date();
    return this;
  }

  updateStatus(status: IncidentStatus): IncidentEntity {
    this.status = status;
    this.updatedAt = new Date();
    
    // Set resolvedAt when status changes to resolved
    if (status === 'resolved' && !this.resolvedAt) {
      this.resolvedAt = new Date();
    }
    
    return this;
  }

  isActive(): boolean {
    return this.status !== 'resolved';
  }

  canTransitionTo(targetStatus: IncidentStatus): boolean {
    const validTransitions: Record<IncidentStatus, IncidentStatus[]> = {
      'investigating': ['identified', 'monitoring', 'resolved'],
      'identified': ['investigating', 'monitoring', 'resolved'],
      'monitoring': ['investigating', 'identified', 'resolved'],
      'resolved': ['investigating'], // Can reopen a resolved incident
    };

    return validTransitions[this.status].includes(targetStatus);
  }
} 