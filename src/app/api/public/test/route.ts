import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "ok",
    message: "Public API is working",
    timestamp: new Date().toISOString()
  });
} 