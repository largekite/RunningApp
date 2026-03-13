import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserProfile, TrainingPlan, ActivityCheckIn, InjuryLog, RunningShoe,
  HydrationLog, BodyWeightEntry, SavedRoute, RaceEvent, BenchmarkResult,
  KStrideSession, AppState,
} from '../context/types';

const KEYS = {
  USER_PROFILE: '@RunningApp:userProfile',
  TRAINING_PLAN: '@RunningApp:trainingPlan',
  CHECK_INS: '@RunningApp:checkIns',
  INJURIES: '@RunningApp:injuries',
  SHOES: '@RunningApp:shoes',
  HYDRATION_LOGS: '@RunningApp:hydrationLogs',
  BODY_WEIGHTS: '@RunningApp:bodyWeights',
  SAVED_ROUTES: '@RunningApp:savedRoutes',
  RACE_EVENTS: '@RunningApp:raceEvents',
  BENCHMARKS: '@RunningApp:benchmarks',
  KSTRIDE_SESSION: '@RunningApp:kstrideSession',
  ONBOARDING_COMPLETE: '@RunningApp:onboardingComplete',
  APP_STATE: '@RunningApp:appState',
};

class StorageService {
  // ─── User Profile ──────────────────────────────────────────────────
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const v = await AsyncStorage.getItem(KEYS.USER_PROFILE);
      return v ? JSON.parse(v) : null;
    } catch { return null; }
  }
  async saveUserProfile(profile: UserProfile): Promise<boolean> {
    try { await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile)); return true; }
    catch { return false; }
  }
  async updateUserProfile(updates: Partial<UserProfile>): Promise<boolean> {
    const current = await this.getUserProfile();
    if (!current) return false;
    return this.saveUserProfile({ ...current, ...updates, updatedAt: new Date().toISOString() });
  }

  // ─── Training Plan ─────────────────────────────────────────────────
  async getTrainingPlan(): Promise<TrainingPlan | null> {
    try {
      const v = await AsyncStorage.getItem(KEYS.TRAINING_PLAN);
      return v ? JSON.parse(v) : null;
    } catch { return null; }
  }
  async saveTrainingPlan(plan: TrainingPlan): Promise<boolean> {
    try { await AsyncStorage.setItem(KEYS.TRAINING_PLAN, JSON.stringify(plan)); return true; }
    catch { return false; }
  }
  async updateTrainingPlan(updates: Partial<TrainingPlan>): Promise<boolean> {
    const current = await this.getTrainingPlan();
    if (!current) return false;
    return this.saveTrainingPlan({ ...current, ...updates });
  }

  // ─── Check-Ins ─────────────────────────────────────────────────────
  async getCheckIns(): Promise<{ [date: string]: ActivityCheckIn }> {
    try {
      const v = await AsyncStorage.getItem(KEYS.CHECK_INS);
      return v ? JSON.parse(v) : {};
    } catch { return {}; }
  }
  async saveCheckIns(checkIns: { [date: string]: ActivityCheckIn }): Promise<boolean> {
    try { await AsyncStorage.setItem(KEYS.CHECK_INS, JSON.stringify(checkIns)); return true; }
    catch { return false; }
  }
  async addCheckIn(checkIn: ActivityCheckIn): Promise<boolean> {
    const all = await this.getCheckIns();
    all[checkIn.date] = checkIn;
    return this.saveCheckIns(all);
  }
  async updateCheckIn(date: string, updates: Partial<ActivityCheckIn>): Promise<boolean> {
    const all = await this.getCheckIns();
    if (!all[date]) return false;
    all[date] = { ...all[date], ...updates, updatedAt: new Date().toISOString() };
    return this.saveCheckIns(all);
  }
  async deleteCheckIn(date: string): Promise<boolean> {
    const all = await this.getCheckIns();
    delete all[date];
    return this.saveCheckIns(all);
  }
  async getCheckIn(date: string): Promise<ActivityCheckIn | null> {
    const all = await this.getCheckIns();
    return all[date] || null;
  }

  // ─── Injuries ──────────────────────────────────────────────────────
  async getInjuries(): Promise<InjuryLog[]> {
    try {
      const v = await AsyncStorage.getItem(KEYS.INJURIES);
      return v ? JSON.parse(v) : [];
    } catch { return []; }
  }
  async saveInjuries(injuries: InjuryLog[]): Promise<boolean> {
    try { await AsyncStorage.setItem(KEYS.INJURIES, JSON.stringify(injuries)); return true; }
    catch { return false; }
  }
  async addInjury(injury: InjuryLog): Promise<boolean> {
    const all = await this.getInjuries();
    all.push(injury);
    return this.saveInjuries(all);
  }
  async resolveInjury(id: string): Promise<boolean> {
    const all = await this.getInjuries();
    return this.saveInjuries(
      all.map(i => i.id === id ? { ...i, resolved: true, resolvedDate: new Date().toISOString().split('T')[0] } : i)
    );
  }

  // ─── Shoes ─────────────────────────────────────────────────────────
  async getShoes(): Promise<RunningShoe[]> {
    try {
      const v = await AsyncStorage.getItem(KEYS.SHOES);
      return v ? JSON.parse(v) : [];
    } catch { return []; }
  }
  async saveShoes(shoes: RunningShoe[]): Promise<boolean> {
    try { await AsyncStorage.setItem(KEYS.SHOES, JSON.stringify(shoes)); return true; }
    catch { return false; }
  }
  async addShoe(shoe: RunningShoe): Promise<boolean> {
    const all = await this.getShoes();
    all.push(shoe);
    return this.saveShoes(all);
  }
  async updateShoe(shoe: RunningShoe): Promise<boolean> {
    const all = await this.getShoes();
    const idx = all.findIndex(s => s.id === shoe.id);
    if (idx === -1) return false;
    all[idx] = shoe;
    return this.saveShoes(all);
  }

  // ─── Hydration ─────────────────────────────────────────────────────
  async getHydrationLogs(): Promise<{ [date: string]: HydrationLog }> {
    try {
      const v = await AsyncStorage.getItem(KEYS.HYDRATION_LOGS);
      return v ? JSON.parse(v) : {};
    } catch { return {}; }
  }
  async saveHydrationLogs(logs: { [date: string]: HydrationLog }): Promise<boolean> {
    try { await AsyncStorage.setItem(KEYS.HYDRATION_LOGS, JSON.stringify(logs)); return true; }
    catch { return false; }
  }
  async setHydrationLog(log: HydrationLog): Promise<boolean> {
    const all = await this.getHydrationLogs();
    all[log.date] = log;
    return this.saveHydrationLogs(all);
  }

  // ─── Body Weight ───────────────────────────────────────────────────
  async getBodyWeights(): Promise<BodyWeightEntry[]> {
    try {
      const v = await AsyncStorage.getItem(KEYS.BODY_WEIGHTS);
      return v ? JSON.parse(v) : [];
    } catch { return []; }
  }
  async saveBodyWeights(entries: BodyWeightEntry[]): Promise<boolean> {
    try { await AsyncStorage.setItem(KEYS.BODY_WEIGHTS, JSON.stringify(entries)); return true; }
    catch { return false; }
  }
  async addBodyWeight(entry: BodyWeightEntry): Promise<boolean> {
    const all = await this.getBodyWeights();
    all.push(entry);
    return this.saveBodyWeights(all.sort((a, b) => a.date.localeCompare(b.date)));
  }

  // ─── Saved Routes ──────────────────────────────────────────────────
  async getSavedRoutes(): Promise<SavedRoute[]> {
    try {
      const v = await AsyncStorage.getItem(KEYS.SAVED_ROUTES);
      return v ? JSON.parse(v) : [];
    } catch { return []; }
  }
  async saveSavedRoutes(routes: SavedRoute[]): Promise<boolean> {
    try { await AsyncStorage.setItem(KEYS.SAVED_ROUTES, JSON.stringify(routes)); return true; }
    catch { return false; }
  }
  async addSavedRoute(route: SavedRoute): Promise<boolean> {
    const all = await this.getSavedRoutes();
    if (all.length >= 20) all.shift(); // cap at 20
    all.push(route);
    return this.saveSavedRoutes(all);
  }
  async deleteSavedRoute(id: string): Promise<boolean> {
    const all = await this.getSavedRoutes();
    return this.saveSavedRoutes(all.filter(r => r.id !== id));
  }

  // ─── Race Events ───────────────────────────────────────────────────
  async getRaceEvents(): Promise<RaceEvent[]> {
    try {
      const v = await AsyncStorage.getItem(KEYS.RACE_EVENTS);
      return v ? JSON.parse(v) : [];
    } catch { return []; }
  }
  async saveRaceEvents(events: RaceEvent[]): Promise<boolean> {
    try { await AsyncStorage.setItem(KEYS.RACE_EVENTS, JSON.stringify(events)); return true; }
    catch { return false; }
  }
  async addRaceEvent(event: RaceEvent): Promise<boolean> {
    const all = await this.getRaceEvents();
    all.push(event);
    return this.saveRaceEvents(all);
  }
  async updateRaceEvent(event: RaceEvent): Promise<boolean> {
    const all = await this.getRaceEvents();
    return this.saveRaceEvents(all.map(e => e.id === event.id ? event : e));
  }
  async deleteRaceEvent(id: string): Promise<boolean> {
    const all = await this.getRaceEvents();
    return this.saveRaceEvents(all.filter(e => e.id !== id));
  }

  // ─── Benchmarks ────────────────────────────────────────────────────
  async getBenchmarks(): Promise<BenchmarkResult[]> {
    try {
      const v = await AsyncStorage.getItem(KEYS.BENCHMARKS);
      return v ? JSON.parse(v) : [];
    } catch { return []; }
  }
  async saveBenchmarks(results: BenchmarkResult[]): Promise<boolean> {
    try { await AsyncStorage.setItem(KEYS.BENCHMARKS, JSON.stringify(results)); return true; }
    catch { return false; }
  }
  async addBenchmark(result: BenchmarkResult): Promise<boolean> {
    const all = await this.getBenchmarks();
    all.push(result);
    return this.saveBenchmarks(all.sort((a, b) => b.date.localeCompare(a.date)));
  }
  async deleteBenchmark(id: string): Promise<boolean> {
    const all = await this.getBenchmarks();
    return this.saveBenchmarks(all.filter(r => r.id !== id));
  }

  // ─── KStride Session ───────────────────────────────────────────────
  async getKStrideSession(): Promise<KStrideSession | null> {
    try {
      const v = await AsyncStorage.getItem(KEYS.KSTRIDE_SESSION);
      return v ? JSON.parse(v) : null;
    } catch { return null; }
  }
  async saveKStrideSession(session: KStrideSession | null): Promise<boolean> {
    try {
      if (session) {
        await AsyncStorage.setItem(KEYS.KSTRIDE_SESSION, JSON.stringify(session));
      } else {
        await AsyncStorage.removeItem(KEYS.KSTRIDE_SESSION);
      }
      return true;
    } catch { return false; }
  }

  // ─── Onboarding ────────────────────────────────────────────────────
  async hasCompletedOnboarding(): Promise<boolean> {
    try {
      const v = await AsyncStorage.getItem(KEYS.ONBOARDING_COMPLETE);
      return v === 'true';
    } catch { return false; }
  }
  async setOnboardingComplete(complete: boolean): Promise<boolean> {
    try { await AsyncStorage.setItem(KEYS.ONBOARDING_COMPLETE, String(complete)); return true; }
    catch { return false; }
  }

  // ─── Full App State ────────────────────────────────────────────────
  async getAppState(): Promise<Partial<AppState> | null> {
    try {
      const v = await AsyncStorage.getItem(KEYS.APP_STATE);
      return v ? JSON.parse(v) : null;
    } catch { return null; }
  }

  // ─── Load All Data ─────────────────────────────────────────────────
  async loadAllData(): Promise<{
    userProfile: UserProfile | null;
    trainingPlan: TrainingPlan | null;
    checkIns: { [date: string]: ActivityCheckIn };
    injuries: InjuryLog[];
    shoes: RunningShoe[];
    hydrationLogs: { [date: string]: HydrationLog };
    bodyWeightEntries: BodyWeightEntry[];
    savedRoutes: SavedRoute[];
    raceEvents: RaceEvent[];
    benchmarkResults: BenchmarkResult[];
    kstrideSession: KStrideSession | null;
    hasCompletedOnboarding: boolean;
  }> {
    const [
      userProfile, trainingPlan, checkIns, injuries, shoes,
      hydrationLogs, bodyWeightEntries, savedRoutes, raceEvents,
      benchmarkResults, kstrideSession, hasCompletedOnboarding,
    ] = await Promise.all([
      this.getUserProfile(),
      this.getTrainingPlan(),
      this.getCheckIns(),
      this.getInjuries(),
      this.getShoes(),
      this.getHydrationLogs(),
      this.getBodyWeights(),
      this.getSavedRoutes(),
      this.getRaceEvents(),
      this.getBenchmarks(),
      this.getKStrideSession(),
      this.hasCompletedOnboarding(),
    ]);

    return {
      userProfile, trainingPlan, checkIns, injuries, shoes,
      hydrationLogs, bodyWeightEntries, savedRoutes, raceEvents,
      benchmarkResults, kstrideSession, hasCompletedOnboarding,
    };
  }

  // ─── Clear All Data ────────────────────────────────────────────────
  async clearAllData(): Promise<boolean> {
    try {
      await AsyncStorage.multiRemove(Object.values(KEYS));
      return true;
    } catch { return false; }
  }
}

export default new StorageService();
