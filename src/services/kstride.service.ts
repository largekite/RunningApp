/**
 * KStride Integration Service
 *
 * Connects the RunningApp directly to KStride's Supabase backend.
 * Users sign in with their KStride credentials and their workouts
 * are synced to kstride.com automatically.
 *
 * SETUP: Fill in your Supabase project URL and anon key below.
 * Find these in your Vercel project settings → Environment Variables,
 * or in the Supabase dashboard → Project Settings → API.
 */

import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import { ActivityCheckIn, TrainingPlan } from '../context/types';

// ─── Configure these with your KStride Supabase credentials ───────────────────
const KSTRIDE_SUPABASE_URL: string = 'YOUR_KSTRIDE_SUPABASE_URL';   // e.g. https://xxxx.supabase.co
const KSTRIDE_SUPABASE_ANON_KEY: string = 'YOUR_KSTRIDE_SUPABASE_ANON_KEY';
// ─────────────────────────────────────────────────────────────────────────────

export interface KStrideSession {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
}

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    if (!KSTRIDE_SUPABASE_URL || KSTRIDE_SUPABASE_URL === 'YOUR_KSTRIDE_SUPABASE_URL') {
      throw new Error('KStride Supabase URL not configured. Update kstride.service.ts.');
    }
    _client = createClient(KSTRIDE_SUPABASE_URL, KSTRIDE_SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
  }
  return _client;
}

function isConfigured(): boolean {
  return (
    KSTRIDE_SUPABASE_URL !== 'YOUR_KSTRIDE_SUPABASE_URL' &&
    KSTRIDE_SUPABASE_URL.length > 0
  );
}

/** Sign in with email + password. Returns a KStrideSession or throws. */
async function signIn(email: string, password: string): Promise<KStrideSession> {
  const client = getClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(error?.message || 'Sign-in failed');
  }
  return sessionFromSupabase(data.session);
}

/** Sign out of Supabase session. */
async function signOut(session: KStrideSession): Promise<void> {
  const client = getClient();
  client.auth.setSession({
    access_token: session.accessToken,
    refresh_token: session.refreshToken,
  });
  await client.auth.signOut();
}

/** Refresh the access token if it's about to expire. */
async function refreshSession(session: KStrideSession): Promise<KStrideSession | null> {
  try {
    const client = getClient();
    const { data, error } = await client.auth.refreshSession({
      refresh_token: session.refreshToken,
    });
    if (error || !data.session) return null;
    return sessionFromSupabase(data.session);
  } catch {
    return null;
  }
}

function sessionFromSupabase(s: Session): KStrideSession {
  return {
    userId: s.user.id,
    email: s.user.email ?? '',
    accessToken: s.access_token,
    refreshToken: s.refresh_token ?? '',
    expiresAt: s.expires_at ?? Math.floor(Date.now() / 1000) + 3600,
  };
}

/** Ensure the session is fresh before making API calls. */
async function ensureFreshSession(session: KStrideSession): Promise<KStrideSession> {
  const bufferSecs = 60;
  if (session.expiresAt - (Date.now() / 1000) < bufferSecs) {
    const refreshed = await refreshSession(session);
    return refreshed ?? session;
  }
  return session;
}

function authedClient(session: KStrideSession): SupabaseClient {
  const client = getClient();
  client.auth.setSession({
    access_token: session.accessToken,
    refresh_token: session.refreshToken,
  });
  return client;
}

// ─── Check-in sync ─────────────────────────────────────────────────────────────

/**
 * Push a single check-in to KStride.
 * Upserts by id so re-syncing is safe.
 *
 * Duration conversion: RunningApp stores minutes, KStride stores seconds.
 */
async function syncCheckIn(
  rawSession: KStrideSession,
  checkIn: ActivityCheckIn,
): Promise<void> {
  const session = await ensureFreshSession(rawSession);
  const client = authedClient(session);

  const row = {
    id: checkIn.id,
    user_id: session.userId,
    date: checkIn.date,
    workout_id: checkIn.workoutId,
    completed: checkIn.completed,
    actual_distance: checkIn.actualDistance ?? null,
    actual_duration: checkIn.actualDuration != null
      ? Math.round(checkIn.actualDuration * 60)   // minutes → seconds
      : null,
    actual_pace: checkIn.actualPace ?? null,
    perceived_effort: checkIn.perceivedEffort ?? null,
    notes: checkIn.notes ?? null,
    sleep_hours: checkIn.sleepHours ?? null,
    sleep_quality: checkIn.sleepQuality ?? null,
    nutrition_score: checkIn.nutritionScore ?? null,
    nutrition_notes: checkIn.nutritionNotes ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await client
    .from('check_ins')
    .upsert(row, { onConflict: 'id' });

  if (error) throw new Error(`KStride sync failed: ${error.message}`);
}

/**
 * Push all completed check-ins to KStride in a single batch upsert.
 * Returns the number of records synced.
 */
async function syncAllCheckIns(
  rawSession: KStrideSession,
  checkIns: { [date: string]: ActivityCheckIn },
): Promise<number> {
  const session = await ensureFreshSession(rawSession);
  const client = authedClient(session);

  const completed = Object.values(checkIns).filter(c => c.completed);
  if (completed.length === 0) return 0;

  const rows = completed.map(checkIn => ({
    id: checkIn.id,
    user_id: session.userId,
    date: checkIn.date,
    workout_id: checkIn.workoutId,
    completed: checkIn.completed,
    actual_distance: checkIn.actualDistance ?? null,
    actual_duration: checkIn.actualDuration != null
      ? Math.round(checkIn.actualDuration * 60)
      : null,
    actual_pace: checkIn.actualPace ?? null,
    perceived_effort: checkIn.perceivedEffort ?? null,
    notes: checkIn.notes ?? null,
    sleep_hours: checkIn.sleepHours ?? null,
    sleep_quality: checkIn.sleepQuality ?? null,
    nutrition_score: checkIn.nutritionScore ?? null,
    nutrition_notes: checkIn.nutritionNotes ?? null,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await client
    .from('check_ins')
    .upsert(rows, { onConflict: 'id' });

  if (error) throw new Error(`KStride batch sync failed: ${error.message}`);
  return rows.length;
}

// ─── Training plan sync ─────────────────────────────────────────────────────────

/**
 * Push the current training plan to KStride.
 * KStride's `weeks` column is JSONB — we pass our WeeklyPlan[] directly.
 */
async function syncTrainingPlan(
  rawSession: KStrideSession,
  plan: TrainingPlan,
): Promise<void> {
  const session = await ensureFreshSession(rawSession);
  const client = authedClient(session);

  const row = {
    id: plan.id,
    user_id: session.userId,
    goal_distance: plan.goalDistance,
    race_elevation_ft: 0,                          // not tracked in RunningApp
    start_date: plan.startDate,
    race_date: plan.raceDate,
    current_week: plan.currentWeek,
    total_weeks: plan.totalWeeks,
    base_weekly_mileage: plan.baseWeeklyMileage,
    peak_weekly_mileage: plan.peakWeeklyMileage,
    plan_confidence: 1.0,
    weeks: plan.weeks,
    updated_at: new Date().toISOString(),
  };

  const { error } = await client
    .from('training_plans')
    .upsert(row, { onConflict: 'id' });

  if (error) throw new Error(`KStride plan sync failed: ${error.message}`);
}

// ─── Live activity ──────────────────────────────────────────────────────────────

/**
 * Start a live activity on KStride (shows you as "active" on the community feed).
 * Returns the live activity ID.
 */
async function startLiveActivity(rawSession: KStrideSession): Promise<string> {
  const session = await ensureFreshSession(rawSession);
  const client = authedClient(session);

  const { data, error } = await client
    .from('live_activities')
    .insert({
      user_id: session.userId,
      status: 'active',
      distance: 0,
      elapsed_seconds: 0,
      current_pace: null,
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error || !data) throw new Error(`KStride live activity failed: ${error?.message}`);
  return data.id as string;
}

/**
 * Update a live activity in progress (call every ~10 seconds during a run).
 */
async function updateLiveActivity(
  rawSession: KStrideSession,
  activityId: string,
  distance: number,
  elapsedSeconds: number,
  currentPace: string | null,
): Promise<void> {
  const session = await ensureFreshSession(rawSession);
  const client = authedClient(session);

  await client
    .from('live_activities')
    .update({
      status: 'active',
      distance,
      elapsed_seconds: elapsedSeconds,
      current_pace: currentPace,
      updated_at: new Date().toISOString(),
    })
    .eq('id', activityId)
    .eq('user_id', session.userId);
}

/**
 * Finish a live activity.
 */
async function finishLiveActivity(
  rawSession: KStrideSession,
  activityId: string,
  distance: number,
  elapsedSeconds: number,
): Promise<void> {
  const session = await ensureFreshSession(rawSession);
  const client = authedClient(session);

  await client
    .from('live_activities')
    .update({
      status: 'finished',
      distance,
      elapsed_seconds: elapsedSeconds,
      updated_at: new Date().toISOString(),
    })
    .eq('id', activityId)
    .eq('user_id', session.userId);
}

const KStrideService = {
  isConfigured,
  signIn,
  signOut,
  refreshSession,
  syncCheckIn,
  syncAllCheckIns,
  syncTrainingPlan,
  startLiveActivity,
  updateLiveActivity,
  finishLiveActivity,
};

export default KStrideService;
