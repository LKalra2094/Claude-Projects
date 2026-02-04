import { NextResponse } from 'next/server';
import { getTodayQuota } from '@/services/storage';
import { QuotaResponse } from '@/types';

const DAILY_LIMIT = 10000;

export async function GET() {
  try {
    const todayQuota = getTodayQuota();

    const response: QuotaResponse = {
      unitsUsedToday: todayQuota.unitsUsed,
      dailyLimit: DAILY_LIMIT,
      percentUsed: Math.round((todayQuota.unitsUsed / DAILY_LIMIT) * 100 * 10) / 10,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Quota API error:', error);
    return NextResponse.json(
      { error: 'Failed to get quota' },
      { status: 500 }
    );
  }
}
