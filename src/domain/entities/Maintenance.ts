export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed';

export interface Maintenance {
  id: string;
  title: string;
  description?: string;
  status: MaintenanceStatus;
  organizationId: string;
  createdById?: string;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class MaintenanceEntity implements Maintenance {
  id: string;
  title: string;
  description?: string;
  status: MaintenanceStatus;
  organizationId: string;
  createdById?: string;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  createdAt: Date;
  updatedAt: Date;

  constructor(params: Maintenance) {
    this.id = params.id;
    this.title = params.title;
    this.description = params.description;
    this.status = params.status;
    this.organizationId = params.organizationId;
    this.createdById = params.createdById;
    this.scheduledStartTime = params.scheduledStartTime;
    this.scheduledEndTime = params.scheduledEndTime;
    this.actualStartTime = params.actualStartTime;
    this.actualEndTime = params.actualEndTime;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }

  static create(params: Omit<Maintenance, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'actualStartTime' | 'actualEndTime'> & Partial<Pick<Maintenance, 'status'>>): MaintenanceEntity {
    const now = new Date();
    return new MaintenanceEntity({
      id: crypto.randomUUID(),
      status: 'scheduled',
      ...params,
      createdAt: now,
      updatedAt: now,
    });
  }

  update(params: Partial<Pick<Maintenance, 'title' | 'description' | 'scheduledStartTime' | 'scheduledEndTime'>>): MaintenanceEntity {
    if (params.title) this.title = params.title;
    if (params.description !== undefined) this.description = params.description;
    if (params.scheduledStartTime) this.scheduledStartTime = params.scheduledStartTime;
    if (params.scheduledEndTime) this.scheduledEndTime = params.scheduledEndTime;
    this.updatedAt = new Date();
    return this;
  }

  updateStatus(status: MaintenanceStatus): MaintenanceEntity {
    // Handle transitions with side effects
    if (status === 'in_progress' && this.status === 'scheduled') {
      this.actualStartTime = new Date();
    } else if (status === 'completed' && (this.status === 'scheduled' || this.status === 'in_progress')) {
      if (!this.actualStartTime) {
        this.actualStartTime = new Date();
      }
      this.actualEndTime = new Date();
    }
    
    this.status = status;
    this.updatedAt = new Date();
    return this;
  }

  isActive(): boolean {
    return this.status !== 'completed';
  }

  isUpcoming(): boolean {
    return this.status === 'scheduled' && this.scheduledStartTime > new Date();
  }

  isInProgress(): boolean {
    return this.status === 'in_progress' || 
      (this.status === 'scheduled' && 
        this.scheduledStartTime <= new Date() && 
        this.scheduledEndTime > new Date());
  }

  canTransitionTo(targetStatus: MaintenanceStatus): boolean {
    const validTransitions: Record<MaintenanceStatus, MaintenanceStatus[]> = {
      'scheduled': ['in_progress', 'completed'],
      'in_progress': ['completed'],
      'completed': [], // Can't transition from completed
    };

    return validTransitions[this.status].includes(targetStatus);
  }
} 