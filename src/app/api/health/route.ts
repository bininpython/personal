import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startedAt = Date.now();
  try {
    const admin = createAdminClient();
    const { error } = await admin.from('trainers').select('id').limit(1);
    if (error) throw error;

    return NextResponse.json({
      status: 'ok',
      checks: { database: 'ok' },
      responseTimeMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[Health Check] Database unavailable:', error);
    return NextResponse.json({
      status: 'degraded',
      checks: { database: 'unavailable' },
      timestamp: new Date().toISOString(),
    }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
