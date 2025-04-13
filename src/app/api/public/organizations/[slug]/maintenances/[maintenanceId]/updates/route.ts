import { NextRequest, NextResponse } from 'next/server';
import { OrganizationRepositoryImpl } from '@/infrastructure/repositories/OrganizationRepositoryImpl';
import { MaintenanceRepositoryImpl } from '@/infrastructure/repositories/MaintenanceRepositoryImpl';
import { CommentRepositoryImpl } from '@/infrastructure/repositories/CommentRepositoryImpl';

const organizationRepository = new OrganizationRepositoryImpl();
const maintenanceRepository = new MaintenanceRepositoryImpl();
const commentRepository = new CommentRepositoryImpl();

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string; maintenanceId: string } }
) {
  try {
    const { slug, maintenanceId } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const organization = await organizationRepository.findBySlug(slug);

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const maintenance = await maintenanceRepository.findById(maintenanceId);

    if (!maintenance || maintenance.organizationId !== organization.id) {
      return NextResponse.json(
        { error: 'Maintenance not found' },
        { status: 404 }
      );
    }

    // Get comments/updates for the maintenance
    const comments = await commentRepository.findByEntityId(maintenanceId, {
      page,
      limit,
      entityType: 'maintenance',
    });

    // Return only public information
    return NextResponse.json({
      updates: comments.items.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      })),
      pagination: {
        total: comments.total,
        page: comments.page,
        limit: comments.limit,
        totalPages: comments.totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching public maintenance updates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 