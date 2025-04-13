import { IncidentEntity, IncidentStatus, IncidentSeverity } from '../Incident';

describe('IncidentEntity', () => {
  const mockIncidentData = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'API Outage',
    description: 'API is experiencing outages',
    status: 'investigating' as IncidentStatus,
    severity: 'major' as IncidentSeverity,
    organizationId: '123e4567-e89b-12d3-a456-426614174001',
    createdById: '123e4567-e89b-12d3-a456-426614174002',
    startedAt: new Date('2023-01-01T00:00:00Z'),
    resolvedAt: null,
    createdAt: new Date('2023-01-01T00:10:00Z'),
    updatedAt: new Date('2023-01-01T00:10:00Z'),
  };

  it('should create an incident entity', () => {
    const incident = new IncidentEntity(mockIncidentData);
    
    expect(incident.id).toBe(mockIncidentData.id);
    expect(incident.title).toBe(mockIncidentData.title);
    expect(incident.description).toBe(mockIncidentData.description);
    expect(incident.status).toBe(mockIncidentData.status);
    expect(incident.severity).toBe(mockIncidentData.severity);
    expect(incident.organizationId).toBe(mockIncidentData.organizationId);
    expect(incident.createdById).toBe(mockIncidentData.createdById);
    expect(incident.startedAt).toEqual(mockIncidentData.startedAt);
    expect(incident.resolvedAt).toBeNull();
    expect(incident.createdAt).toEqual(mockIncidentData.createdAt);
    expect(incident.updatedAt).toEqual(mockIncidentData.updatedAt);
  });

  it('should update status correctly', () => {
    const incident = new IncidentEntity(mockIncidentData);
    const newStatus: IncidentStatus = 'identified';
    
    // Keep track of the original update time
    const originalUpdatedAt = incident.updatedAt;
    
    // Wait a small amount of time to ensure the updatedAt timestamp changes
    jest.advanceTimersByTime(1000);
    
    incident.updateStatus(newStatus);
    
    expect(incident.status).toBe(newStatus);
    expect(incident.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should set resolvedAt when status changes to resolved', () => {
    const incident = new IncidentEntity(mockIncidentData);
    
    // Initially resolvedAt should be null
    expect(incident.resolvedAt).toBeNull();
    
    // Update to a non-resolved status
    incident.updateStatus('monitoring');
    expect(incident.resolvedAt).toBeNull();
    
    // Update to resolved status
    incident.updateStatus('resolved');
    expect(incident.resolvedAt).not.toBeNull();
    expect(incident.resolvedAt instanceof Date).toBe(true);
  });

  it('should update severity correctly', () => {
    const incident = new IncidentEntity(mockIncidentData);
    const newSeverity: IncidentSeverity = 'critical';
    
    const originalUpdatedAt = incident.updatedAt;
    jest.advanceTimersByTime(1000);
    
    incident.updateSeverity(newSeverity);
    
    expect(incident.severity).toBe(newSeverity);
    expect(incident.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should detect active status correctly', () => {
    const incident = new IncidentEntity({
      ...mockIncidentData,
      status: 'investigating'
    });
    expect(incident.isActive()).toBe(true);
    
    incident.updateStatus('identified');
    expect(incident.isActive()).toBe(true);
    
    incident.updateStatus('monitoring');
    expect(incident.isActive()).toBe(true);
    
    incident.updateStatus('resolved');
    expect(incident.isActive()).toBe(false);
  });

  it('should not set resolvedAt when already resolved and status changes again', () => {
    const resolved = new Date('2023-01-02T00:00:00Z');
    const incident = new IncidentEntity({
      ...mockIncidentData,
      status: 'resolved',
      resolvedAt: resolved
    });
    
    // Update back to an active status
    incident.updateStatus('monitoring');
    
    // resolvedAt should remain the same since we're moving from resolved to an active status
    expect(incident.resolvedAt).toEqual(resolved);
  });
}); 