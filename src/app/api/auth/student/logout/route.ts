// ============================================
// POST /api/auth/student/logout
// ============================================

import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth/session';

export async function POST() {
  await clearSession();
  return NextResponse.json({ success: true });
}
