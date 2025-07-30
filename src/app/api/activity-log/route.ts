import { getActivityLogs } from '../../../../lib/activityLogger';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100');

    const logs = await getActivityLogs(startDate, endDate, limit);

    return new Response(JSON.stringify(logs), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('GET /api/activity-log error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch activity logs' }),
      { status: 500 }
    );
  }
}