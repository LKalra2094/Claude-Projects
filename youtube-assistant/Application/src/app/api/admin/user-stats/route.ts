import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Run three queries in parallel
    const [usersResult, searchesResult, clicksResult, feedbackResult] = await Promise.all([
      pool.query(
        `SELECT email, name, image FROM users ORDER BY created_at ASC`
      ),
      pool.query(
        `SELECT user_id, COUNT(*)::integer AS total_searches FROM query_history GROUP BY user_id`
      ),
      pool.query(
        `SELECT user_id, COUNT(*)::integer AS total_clicks FROM click_events GROUP BY user_id`
      ),
      pool.query(
        `SELECT user_id, COUNT(*)::integer AS total_feedback FROM feedback GROUP BY user_id`
      ),
    ]);

    // Build lookup maps
    const searchMap = new Map<string, number>();
    for (const row of searchesResult.rows) {
      searchMap.set(row.user_id, row.total_searches);
    }

    const clickMap = new Map<string, number>();
    for (const row of clicksResult.rows) {
      clickMap.set(row.user_id, row.total_clicks);
    }

    const feedbackMap = new Map<string, number>();
    for (const row of feedbackResult.rows) {
      feedbackMap.set(row.user_id, row.total_feedback);
    }

    // Merge into user list
    const users = usersResult.rows.map((u) => ({
      email: u.email,
      name: u.name,
      image: u.image,
      totalSearches: searchMap.get(u.email) || 0,
      totalClicks: clickMap.get(u.email) || 0,
      totalFeedback: feedbackMap.get(u.email) || 0,
    }));

    // Sort by searches descending
    users.sort((a, b) => b.totalSearches - a.totalSearches);

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Admin user-stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}
