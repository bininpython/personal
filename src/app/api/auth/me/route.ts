// ============================================
// GET /api/auth/me — Get current session user
// ============================================

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: session.sub,
      role: session.role,
      name: session.name,
      trainer_id: session.trainer_id,
      avatar_url: session.avatar_url,
      background_url: session.background_url,
    },
  });
}
