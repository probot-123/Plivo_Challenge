import { MaintenanceEntity, MaintenanceStatus } from '../Maintenance';

describe('MaintenanceEntity', () => {
  const mockMaintenanceData = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Database Upgrade',
    description: 'Scheduled maintenance for database upgrade',
    status: 'scheduled' as MaintenanceStatus,
    organizationId: '123e4567-e89b-12d3-a456-426614174001',
    createdById: '123e4567-e89b-12d3-a456-426614174002',
    scheduledStartTime: new Date('2023-01-15T01:00:00Z'),
    scheduledEndTime: new Date('2023-01-15T03:00:00Z'),
    actualStartTime: null,
    actualEndTime: null,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z'),
  };

  it('should create a maintenance entity', () => {
    const maintenance = new MaintenanceEntity(mockMaintenanceData);
    
    expect(maintenance.id).toBe(mockMaintenanceData.id);
    expect(maintenance.title).toBe(mockMaintenanceData.title);
    expect(maintenance.description).toBe(mockMaintenanceData.description);
    expect(maintenance.status).toBe(mockMaintenanceData.status);
    expect(maintenance.organizationId).toBe(mockMaintenanceData.organizationId);
    expect(maintenance.createdById).toBe(mockMaintenanceData.createdById);
    expect(maintenance.scheduledStartTime).toEqual(mockMaintenanceData.scheduledStartTime);
    expect(maintenance.scheduledEndTime).toEqual(mockMaintenanceData.scheduledEndTime);
    expect(maintenance.actualStartTime).toBeNull();
    expect(maintenance.actualEndTime).toBeNull();
    expect(maintenance.createdAt).toEqual(mockMaintenanceData.createdAt);
    expect(maintenance.updatedAt).toEqual(mockMaintenanceData.updatedAt);
  });

  it('should update status correctly', () => {
    const maintenance = new MaintenanceEntity(mockMaintenanceData);
    const newStatus: MaintenanceStatus = 'in_progress';
    
    // Keep track of the original update time
    const originalUpdatedAt = maintenance.updatedAt;
    
    // Wait a small amount of time to ensure the updatedAt timestamp changes
    jest.advanceTimersByTime(1000);
    
    maintenance.updateStatus(newStatus);
    
    expect(maintenance.status).toBe(newStatus);
    expect(maintenance.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should set actualStartTime when status changes to in_progress', () => {
    const maintenance = new MaintenanceEntity(mockMaintenanceData);
    
    // Initially actualStartTime should be null
    expect(maintenance.actualStartTime).toBeNull();
    
    // Update to in_progress status
    maintenance.updateStatus('in_progress');
    
    expect(maintenance.actualStartTime).not.toBeNull();
    expect(maintenance.actualStartTime instanceof Date).toBe(true);
    expect(maintenance.actualEndTime).toBeNull(); // End time should still be null
  });

  it('should set actualEndTime when status changes to completed', () => {
    const maintenance = new MaintenanceEntity({
      ...mockMaintenanceData,
      status: 'in_progress',
      actualStartTime: new Date('2023-01-15T01:05:00Z')
    });
    
    // Initially actualEndTime should be null
    expect(maintenance.actualEndTime).toBeNull();
    
    // Update to completed status
    maintenance.updateStatus('completed');
    
    expect(maintenance.actualEndTime).not.toBeNull();
    expect(maintenance.actualEndTime instanceof Date).toBe(true);
  });

  it('should detect active status correctly', () => {
    const maintenance = new MaintenanceEntity({
      ...mockMaintenanceData,
      status: 'scheduled'
    });
    expect(maintenance.isActive()).toBe(true);
    
    maintenance.updateStatus('in_progress');
    expect(maintenance.isActive()).toBe(true);
    
    maintenance.updateStatus('completed');
    expect(maintenance.isActive()).toBe(false);
  });

  it('should detect in-progress state correctly', () => {
    // Test with explicit in_progress status
    const maintenance1 = new MaintenanceEntity({
      ...mockMaintenanceData,
      status: 'in_progress'
    });
    expect(maintenance1.isInProgress()).toBe(true);
    
    // Test with scheduled status but current time is within the scheduled window
    const now = new Date();
    const startTime = new Date(now.getTime() - 1000 * 60 * 30); // 30 minutes ago
    const endTime = new Date(now.getTime() + 1000 * 60 * 30); // 30 minutes from now
    
    const maintenance2 = new MaintenanceEntity({
      ...mockMaintenanceData,
      status: 'scheduled',
      scheduledStartTime: startTime,
      scheduledEndTime: endTime
    });
    
    // Mock current date for the test
    const realDate = global.Date;
    global.Date = class extends Date {
      constructor(date) {
        if (date) {
          return super(date);
        }
        return new realDate(now);
      }
    } as any;
    
    expect(maintenance2.isInProgress()).toBe(true);
    
    // Restore Date
    global.Date = realDate;
    
    // Test with completed status
    const maintenance3 = new MaintenanceEntity({
      ...mockMaintenanceData,
      status: 'completed'
    });
    expect(maintenance3.isInProgress()).toBe(false);
  });
}); 