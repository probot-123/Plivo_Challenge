import { IncidentStatus } from "./Incident";

export interface IncidentUpdate {
  id: string;
  incidentId: string;
  message: string;
  status: IncidentStatus;
  createdById?: string;
  createdAt: Date;
}

export class IncidentUpdateEntity implements IncidentUpdate {
  id: string;
  incidentId: string;
  message: string;
  status: IncidentStatus;
  createdById?: string;
  createdAt: Date;

  constructor(params: IncidentUpdate) {
    this.id = params.id;
    this.incidentId = params.incidentId;
    this.message = params.message;
    this.status = params.status;
    this.createdById = params.createdById;
    this.createdAt = params.createdAt;
  }

  static create(params: Omit<IncidentUpdate, 'id' | 'createdAt'>): IncidentUpdateEntity {
    return new IncidentUpdateEntity({
      id: crypto.randomUUID(),
      ...params,
      createdAt: new Date(),
    });
  }
} 