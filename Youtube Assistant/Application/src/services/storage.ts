import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import {
  StorageData,
  QueryHistoryEntry,
  FeedbackEntry,
  ClickEvent,
  QuotaLogEntry,
} from '@/types';

const STORAGE_PATH = join(process.cwd(), 'src', 'data', 'storage.json');

const EMPTY_STORAGE: StorageData = {
  queryHistory: [],
  feedback: [],
  clickEvents: [],
  quotaLog: [],
};

/**
 * Read storage data from JSON file.
 * Returns empty storage if file doesn't exist.
 */
export function readStorage(): StorageData {
  if (!existsSync(STORAGE_PATH)) {
    return { ...EMPTY_STORAGE };
  }

  try {
    const content = readFileSync(STORAGE_PATH, 'utf-8');
    return JSON.parse(content) as StorageData;
  } catch {
    return { ...EMPTY_STORAGE };
  }
}

/**
 * Write storage data to JSON file.
 */
export function writeStorage(data: StorageData): void {
  writeFileSync(STORAGE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Generate a random query ID.
 */
export function generateQueryId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'q_';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/**
 * Add a query history entry.
 */
export function addQueryHistory(entry: QueryHistoryEntry): void {
  const data = readStorage();
  data.queryHistory.push(entry);
  writeStorage(data);
}

/**
 * Add a feedback entry.
 * Feedback is append-only; most recent per queryId+videoId is authoritative.
 */
export function addFeedback(entry: FeedbackEntry): void {
  const data = readStorage();
  data.feedback.push(entry);
  writeStorage(data);
}

/**
 * Get the most recent feedback for a query+video pair.
 */
export function getLatestFeedback(
  queryId: string,
  videoId: string
): FeedbackEntry | undefined {
  const data = readStorage();
  const matches = data.feedback.filter(
    (f) => f.queryId === queryId && f.videoId === videoId
  );
  return matches.length > 0 ? matches[matches.length - 1] : undefined;
}

/**
 * Add a click event.
 */
export function addClickEvent(event: ClickEvent): void {
  const data = readStorage();
  data.clickEvents.push(event);
  writeStorage(data);
}

/**
 * Get today's date as YYYY-MM-DD string.
 */
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Increment quota usage for today.
 */
export function incrementQuota(units: number): void {
  const data = readStorage();
  const today = getTodayString();

  const todayEntry = data.quotaLog.find((entry) => entry.date === today);
  if (todayEntry) {
    todayEntry.unitsUsed += units;
  } else {
    data.quotaLog.push({ date: today, unitsUsed: units });
  }

  writeStorage(data);
}

/**
 * Get today's quota usage.
 */
export function getTodayQuota(): QuotaLogEntry {
  const data = readStorage();
  const today = getTodayString();

  const todayEntry = data.quotaLog.find((entry) => entry.date === today);
  return todayEntry || { date: today, unitsUsed: 0 };
}
