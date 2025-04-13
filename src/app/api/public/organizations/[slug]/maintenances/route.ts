import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  
  try {
    // Mock maintenances data
    let maintenances = [
      {
        id: '1',
        title: 'Database Optimization',
        description: 'Scheduled maintenance for database optimization. Service may experience brief interruptions.',
        status: 'scheduled',
        organizationId: '1',
        createdById: 'user1',
        scheduledStartTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 1 day from now
        scheduledEndTime: new Date(Date.now() + 1000 * 60 * 60 * 25).toISOString(), // 25 hours from now
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        serviceIds: ['3']
      },
      {
        id: '2',
        title: 'API Infrastructure Upgrade',
        description: 'We are performing an infrastructure upgrade for our API services. This maintenance will improve overall performance and reliability.',
        status: 'in_progress',
        organizationId: '1',
        createdById: 'user1',
        scheduledStartTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        scheduledEndTime: new Date(Date.now() + 1000 * 60 * 30).toISOString(), // 30 minutes from now
        actualStartTime: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 minutes ago
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 minutes ago
        serviceIds: ['2']
      },
      {
        id: '3',
        title: 'Authentication Service Update',
        description: 'Security update for the authentication service. All services have been restored.',
        status: 'completed',
        organizationId: '1',
        createdById: 'user1',
        scheduledStartTime: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
        scheduledEndTime: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
        actualStartTime: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
        actualEndTime: new Date(Date.now() - 1000 * 60 * 60 * 4.5).toISOString(), // 4.5 hours ago
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 24 hours ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4.5).toISOString(), // 4.5 hours ago
        serviceIds: ['4']
      }
    ];
    
    // Filter by status if provided
    if (status) {
      maintenances = maintenances.filter(maintenance => maintenance.status === status);
    }
    
    return NextResponse.json({ maintenances });
  } catch (error) {
    console.error('Error fetching maintenances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch maintenances data' },
      { status: 500 }
    );
  }
} 