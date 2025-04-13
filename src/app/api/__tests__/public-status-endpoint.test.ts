import { server } from '../../../server';
import request from 'supertest';

// Mock the repositories
jest.mock('@/infrastructure/repositories/OrganizationRepositoryImpl', () => {
  return {
    OrganizationRepositoryImpl: jest.fn().mockImplementation(() => {
      return {
        findBySlug: jest.fn().mockImplementation((slug) => {
          if (slug === 'test-org') {
            return Promise.resolve({
              id: '123e4567-e89b-12d3-a456-426614174001',
              name: 'Test Organization',
              slug: 'test-org',
              description: 'Test organization for API testing',
              createdAt: new Date('2023-01-01T00:00:00Z'),
              updatedAt: new Date('2023-01-01T00:00:00Z'),
            });
          }
          return Promise.resolve(null);
        }),
      };
    }),
  };
});

jest.mock('@/infrastructure/repositories/ServiceRepositoryImpl', () => {
  return {
    ServiceRepositoryImpl: jest.fn().mockImplementation(() => {
      return {
        findByOrganizationId: jest.fn().mockImplementation(() => {
          return Promise.resolve({
            items: [
              {
                id: '123e4567-e89b-12d3-a456-426614174002',
                name: 'API',
                description: 'API Service',
                status: 'operational',
                organizationId: '123e4567-e89b-12d3-a456-426614174001',
                createdAt: new Date('2023-01-01T00:00:00Z'),
                updatedAt: new Date('2023-01-01T00:00:00Z'),
              },
              {
                id: '123e4567-e89b-12d3-a456-426614174003',
                name: 'Website',
                description: 'Website Service',
                status: 'degraded_performance',
                organizationId: '123e4567-e89b-12d3-a456-426614174001',
                createdAt: new Date('2023-01-01T00:00:00Z'),
                updatedAt: new Date('2023-01-01T00:00:00Z'),
              },
            ],
            total: 2,
            page: 1,
            limit: 10,
            totalPages: 1,
          });
        }),
      };
    }),
  };
});

jest.mock('@/infrastructure/repositories/IncidentRepositoryImpl', () => {
  return {
    IncidentRepositoryImpl: jest.fn().mockImplementation(() => {
      return {
        findByOrganizationId: jest.fn().mockImplementation(() => {
          return Promise.resolve({
            items: [
              {
                id: '123e4567-e89b-12d3-a456-426614174004',
                title: 'Website Slowdown',
                description: 'Website is experiencing slowdowns',
                status: 'investigating',
                severity: 'minor',
                organizationId: '123e4567-e89b-12d3-a456-426614174001',
                startedAt: new Date('2023-01-05T00:00:00Z'),
                resolvedAt: null,
                createdAt: new Date('2023-01-05T00:10:00Z'),
                updatedAt: new Date('2023-01-05T00:10:00Z'),
              },
            ],
            total: 1,
            page: 1,
            limit: 5,
            totalPages: 1,
          });
        }),
      };
    }),
  };
});

jest.mock('@/infrastructure/repositories/MaintenanceRepositoryImpl', () => {
  return {
    MaintenanceRepositoryImpl: jest.fn().mockImplementation(() => {
      return {
        findByOrganizationId: jest.fn().mockImplementation(() => {
          return Promise.resolve({
            items: [
              {
                id: '123e4567-e89b-12d3-a456-426614174005',
                title: 'Database Upgrade',
                description: 'Scheduled database upgrade',
                status: 'scheduled',
                organizationId: '123e4567-e89b-12d3-a456-426614174001',
                scheduledStartTime: new Date('2023-01-15T01:00:00Z'),
                scheduledEndTime: new Date('2023-01-15T03:00:00Z'),
                actualStartTime: null,
                actualEndTime: null,
                createdAt: new Date('2023-01-01T00:00:00Z'),
                updatedAt: new Date('2023-01-01T00:00:00Z'),
              },
            ],
            total: 1,
            page: 1,
            limit: 5,
            totalPages: 1,
          });
        }),
      };
    }),
  };
});

describe('Public Status API Endpoint', () => {
  beforeAll(async () => {
    // Ensure server is started
    if (!server.listening) {
      await new Promise<void>((resolve) => {
        server.listen(0, () => {
          resolve();
        });
      });
    }
  });

  afterAll((done) => {
    server.close(done);
  });

  it('should return 404 for non-existent organization', async () => {
    const response = await request(server)
      .get('/api/public/organizations/non-existent/status')
      .expect(404);

    expect(response.body).toHaveProperty('error', 'Organization not found');
  });

  it('should return status overview for an existing organization', async () => {
    const response = await request(server)
      .get('/api/public/organizations/test-org/status')
      .expect(200);

    // Verify organization info
    expect(response.body).toHaveProperty('organization');
    expect(response.body.organization).toHaveProperty('name', 'Test Organization');
    expect(response.body.organization).toHaveProperty('slug', 'test-org');

    // Verify status section
    expect(response.body).toHaveProperty('status');
    expect(response.body.status).toHaveProperty('overall');
    expect(response.body.status).toHaveProperty('services');
    expect(response.body.status.services).toBeInstanceOf(Array);
    expect(response.body.status.services).toHaveLength(2);

    // Verify services data
    const services = response.body.status.services;
    expect(services[0]).toHaveProperty('name', 'API');
    expect(services[0]).toHaveProperty('status', 'operational');
    expect(services[1]).toHaveProperty('name', 'Website');
    expect(services[1]).toHaveProperty('status', 'degraded_performance');

    // Verify active incidents
    expect(response.body).toHaveProperty('activeIncidents');
    expect(response.body.activeIncidents).toBeInstanceOf(Array);
    expect(response.body.activeIncidents).toHaveLength(1);
    expect(response.body.activeIncidents[0]).toHaveProperty('title', 'Website Slowdown');
    expect(response.body.activeIncidents[0]).toHaveProperty('status', 'investigating');

    // Verify upcoming maintenances
    expect(response.body).toHaveProperty('upcomingMaintenances');
    expect(response.body.upcomingMaintenances).toBeInstanceOf(Array);
    expect(response.body.upcomingMaintenances).toHaveLength(1);
    expect(response.body.upcomingMaintenances[0]).toHaveProperty('title', 'Database Upgrade');
    expect(response.body.upcomingMaintenances[0]).toHaveProperty('status', 'scheduled');
  });
}); 