import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  
  try {
    // Mock incidents data
    let incidents = [
      {
        id: '1',
        title: 'API Performance Degradation',
        description: 'We are experiencing slow response times with our API services.',
        status: 'investigating',
        impact: 'degraded',
        organizationId: '1',
        createdById: 'user1',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
        serviceIds: ['2']
      },
      {
        id: '2',
        title: 'Database Connection Issues',
        description: 'Database connections were temporarily dropped. The issue has been resolved.',
        status: 'resolved',
        impact: 'partial_outage',
        organizationId: '1',
        createdById: 'user1',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 11).toISOString(), // 11 hours ago
        resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(), // 10 hours ago
        serviceIds: ['3']
      },
      {
        id: '3',
        title: 'Login Service Outage',
        description: 'Login services were unavailable due to an authentication provider issue. All services have been restored.',
        status: 'resolved',
        impact: 'major_outage',
        organizationId: '1',
        createdById: 'user1',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 60).toISOString(), // 2 days ago + 1 hour
        resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 120).toISOString(), // 2 days ago + 2 hours
        serviceIds: ['4']
      }
    ];
    
    // Filter by status if provided
    if (status) {
      incidents = incidents.filter(incident => incident.status === status);
    }
    
    return NextResponse.json({ incidents });
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incidents data' },
      { status: 500 }
    );
  }
} 