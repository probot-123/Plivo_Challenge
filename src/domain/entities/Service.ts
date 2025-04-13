export type ServiceStatus = 'operational' | 'degraded' | 'partial_outage' | 'major_outage';

export interface Service {
  id: string;
  name: string;
  description?: string;
  status: ServiceStatus;
  organizationId: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StatusChange {
  id?: string;
  serviceId: string;
  status: ServiceStatus;
  createdAt: Date;
}

export class ServiceEntity implements Service {
  id: string;
  name: string;
  description?: string;
  status: ServiceStatus;
  organizationId: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(params: Service) {
    this.id = params.id;
    this.name = params.name;
    this.description = params.description;
    this.status = params.status;
    this.organizationId = params.organizationId;
    this.isPublic = params.isPublic;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }

  static create(params: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'isPublic'> & Partial<Pick<Service, 'status' | 'isPublic'>>): ServiceEntity {
    const now = new Date();
    return new ServiceEntity({
      id: crypto.randomUUID(),
      status: 'operational',
      isPublic: true,
      ...params,
      createdAt: now,
      updatedAt: now,
    });
  }

  update(params: Partial<Omit<Service, 'id' | 'organizationId' | 'createdAt'>>) {
    if (params.name) this.name = params.name;
    if (params.description !== undefined) this.description = params.description;
    if (params.status) this.status = params.status;
    if (params.isPublic !== undefined) this.isPublic = params.isPublic;
    this.updatedAt = new Date();
    return this;
  }

  updateStatus(status: ServiceStatus) {
    this.status = status;
    this.updatedAt = new Date();
    return this;
  }

  createStatusChange(): StatusChange {
    return {
      serviceId: this.id,
      status: this.status,
      createdAt: new Date(),
    };
  }

  static getStatusSeverity(status: ServiceStatus): number {
    const severityMap = {
      'operational': 0,
      'degraded': 1,
      'partial_outage': 2,
      'major_outage': 3,
    };
    
    return severityMap[status] || 0;
  }

  static getHighestSeverityStatus(statuses: ServiceStatus[]): ServiceStatus {
    if (statuses.length === 0) {
      return 'operational';
    }
    
    let highestSeverity = -1;
    let highestStatus: ServiceStatus = 'operational';
    
    for (const status of statuses) {
      const severity = ServiceEntity.getStatusSeverity(status);
      if (severity > highestSeverity) {
        highestSeverity = severity;
        highestStatus = status;
      }
    }
    
    return highestStatus;
  }
} 