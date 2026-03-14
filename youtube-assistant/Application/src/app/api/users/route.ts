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

    const result = await pool.query(
      `SELECT email, name, image, created_at FROM users ORDER BY created_at ASC`
    );

    return NextResponse.json({
      users: result.rows.map((row) => ({
        email: row.email,
        name: row.name,
        image: row.image,
        createdAt: row.created_at instanceof Date
          ? row.created_at.toISOString()
          : row.created_at,
      })),
    });
  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
