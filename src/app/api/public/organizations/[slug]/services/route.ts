import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  
  try {
    // Mock service data
    let services = [
      {
        id: '1',
        name: 'Website',
        description: 'Main customer-facing website',
        status: 'operational',
        organizationId: '1',
        isPublic: true,
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'API',
        description: 'Public and private APIs',
        status: 'degraded',
        organizationId: '1',
        isPublic: true,
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Database',
        description: 'Primary database service',
        status: 'operational',
        organizationId: '1',
        isPublic: true,
        updatedAt: new Date().toISOString()
      },
      {
        id: '4',
        name: 'Authentication',
        description: 'User authentication and authorization services',
        status: 'operational',
        organizationId: '1',
        isPublic: true,
        updatedAt: new Date().toISOString()
      },
      {
        id: '5',
        name: 'Payment Processing',
        description: 'Payment gateway and processing',
        status: 'operational',
        organizationId: '1',
        isPublic: true,
        updatedAt: new Date().toISOString()
      }
    ];
    
    // Filter by status if provided
    if (status) {
      services = services.filter(service => service.status === status);
    }
    
    return NextResponse.json({ services });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services data' },
      { status: 500 }
    );
  }
} 