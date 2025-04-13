import { NextRequest, NextResponse } from 'next/server';
import { specs } from '@/lib/swagger';

export async function GET(_request: NextRequest) {
  return NextResponse.json(specs);
} 