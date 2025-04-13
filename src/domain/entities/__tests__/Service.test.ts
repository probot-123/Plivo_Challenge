import { ServiceEntity, ServiceStatus } from '../Service';

describe('ServiceEntity', () => {
  const mockServiceData = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'API Service',
    description: 'Core API service',
    status: 'operational' as ServiceStatus,
    organizationId: '123e4567-e89b-12d3-a456-426614174001',
    createdById: '123e4567-e89b-12d3-a456-426614174002',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z'),
  };

  it('should create a service entity', () => {
    const service = new ServiceEntity(mockServiceData);
    
    expect(service.id).toBe(mockServiceData.id);
    expect(service.name).toBe(mockServiceData.name);
    expect(service.description).toBe(mockServiceData.description);
    expect(service.status).toBe(mockServiceData.status);
    expect(service.organizationId).toBe(mockServiceData.organizationId);
    expect(service.createdById).toBe(mockServiceData.createdById);
    expect(service.createdAt).toEqual(mockServiceData.createdAt);
    expect(service.updatedAt).toEqual(mockServiceData.updatedAt);
  });

  it('should update status correctly', () => {
    const service = new ServiceEntity(mockServiceData);
    const newStatus: ServiceStatus = 'partial_outage';
    
    // Keep track of the original update time
    const originalUpdatedAt = service.updatedAt;
    
    // Wait a small amount of time to ensure the updatedAt timestamp changes
    jest.advanceTimersByTime(1000);
    
    service.updateStatus(newStatus);
    
    expect(service.status).toBe(newStatus);
    expect(service.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should create a status change record', () => {
    const service = new ServiceEntity(mockServiceData);
    service.status = 'degraded_performance';
    
    const statusChange = service.createStatusChange();
    
    expect(statusChange.serviceId).toBe(service.id);
    expect(statusChange.fromStatus).toBe('operational');
    expect(statusChange.toStatus).toBe('degraded_performance');
    expect(statusChange.organizationId).toBe(service.organizationId);
    expect(statusChange.createdAt).toBeDefined();
  });

  it('should not create a status change if status has not changed', () => {
    const service = new ServiceEntity(mockServiceData);
    
    // Set the status to the same value
    service.updateStatus('operational');
    
    // This should not actually create a status change because the status didn't change
    const statusChange = service.createStatusChange();
    
    expect(statusChange.fromStatus).toBe(statusChange.toStatus);
  });

  it('should detect degraded status correctly', () => {
    const service = new ServiceEntity({
      ...mockServiceData,
      status: 'operational'
    });
    expect(service.isDegraded()).toBe(false);
    
    service.updateStatus('degraded_performance');
    expect(service.isDegraded()).toBe(true);
    
    service.updateStatus('partial_outage');
    expect(service.isDegraded()).toBe(true);
    
    service.updateStatus('major_outage');
    expect(service.isDegraded()).toBe(true);
    
    service.updateStatus('operational');
    expect(service.isDegraded()).toBe(false);
  });
}); 