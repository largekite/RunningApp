import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
  AppState, AppAction, UserProfile, TrainingPlan, ActivityCheckIn, InjuryLog,
  RunningShoe, HydrationLog, BodyWeightEntry, SavedRoute, RaceEvent,
  BenchmarkResult, KStrideSession,
} from './types';
import StorageService from '../services/storage.service';

const initialState: AppState = {
  user: null,
  trainingPlan: null,
  checkIns: {},
  injuries: [],
  shoes: [],
  hydrationLogs: {},
  bodyWeightEntries: [],
  savedRoutes: [],
  raceEvents: [],
  benchmarkResults: [],
  kstrideSession: null,
  currentDate: new Date().toISOString().split('T')[0],
  isLoading: true,
  hasCompletedOnboarding: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'UPDATE_USER':
      if (!state.user) return state;
      return { ...state, user: { ...state.user, ...action.payload, updatedAt: new Date().toISOString() } };
    case 'SET_TRAINING_PLAN':
      return { ...state, trainingPlan: action.payload };
    case 'UPDATE_TRAINING_PLAN':
      if (!state.trainingPlan) return state;
      return { ...state, trainingPlan: { ...state.trainingPlan, ...action.payload } };
    case 'ADD_CHECK_IN':
      return { ...state, checkIns: { ...state.checkIns, [action.payload.date]: action.payload } };
    case 'UPDATE_CHECK_IN': {
      const { date, checkIn } = action.payload;
      if (!state.checkIns[date]) return state;
      return {
        ...state,
        checkIns: { ...state.checkIns, [date]: { ...state.checkIns[date], ...checkIn, updatedAt: new Date().toISOString() } },
      };
    }
    case 'DELETE_CHECK_IN': {
      const c = { ...state.checkIns };
      delete c[action.payload];
      return { ...state, checkIns: c };
    }
    case 'SET_CHECK_INS':
      return { ...state, checkIns: action.payload };
    case 'ADD_INJURY':
      return { ...state, injuries: [...state.injuries, action.payload] };
    case 'RESOLVE_INJURY':
      return {
        ...state,
        injuries: state.injuries.map(i =>
          i.id === action.payload
            ? { ...i, resolved: true, resolvedDate: new Date().toISOString().split('T')[0] }
            : i
        ),
      };
    case 'SET_INJURIES':
      return { ...state, injuries: action.payload };
    case 'ADD_SHOE':
      return { ...state, shoes: [...state.shoes, action.payload] };
    case 'UPDATE_SHOE':
      return { ...state, shoes: state.shoes.map(s => s.id === action.payload.id ? action.payload : s) };
    case 'SET_SHOES':
      return { ...state, shoes: action.payload };
    // Hydration
    case 'SET_HYDRATION_LOG':
      return { ...state, hydrationLogs: { ...state.hydrationLogs, [action.payload.date]: action.payload } };
    case 'SET_HYDRATION_LOGS':
      return { ...state, hydrationLogs: action.payload };
    // Body weight
    case 'ADD_BODY_WEIGHT':
      return {
        ...state,
        bodyWeightEntries: [...state.bodyWeightEntries, action.payload].sort((a, b) => a.date.localeCompare(b.date)),
      };
    case 'SET_BODY_WEIGHTS':
      return { ...state, bodyWeightEntries: action.payload };
    // Routes
    case 'ADD_ROUTE': {
      const routes = [...state.savedRoutes, action.payload];
      return { ...state, savedRoutes: routes.slice(-20) };
    }
    case 'DELETE_ROUTE':
      return { ...state, savedRoutes: state.savedRoutes.filter(r => r.id !== action.payload) };
    case 'SET_ROUTES':
      return { ...state, savedRoutes: action.payload };
    // Race events
    case 'ADD_RACE_EVENT':
      return { ...state, raceEvents: [...state.raceEvents, action.payload] };
    case 'UPDATE_RACE_EVENT':
      return { ...state, raceEvents: state.raceEvents.map(e => e.id === action.payload.id ? action.payload : e) };
    case 'DELETE_RACE_EVENT':
      return { ...state, raceEvents: state.raceEvents.filter(e => e.id !== action.payload) };
    case 'SET_RACE_EVENTS':
      return { ...state, raceEvents: action.payload };
    // Benchmarks
    case 'ADD_BENCHMARK':
      return {
        ...state,
        benchmarkResults: [action.payload, ...state.benchmarkResults].sort((a, b) => b.date.localeCompare(a.date)),
      };
    case 'DELETE_BENCHMARK':
      return { ...state, benchmarkResults: state.benchmarkResults.filter(r => r.id !== action.payload) };
    case 'SET_BENCHMARKS':
      return { ...state, benchmarkResults: action.payload };
    // KStride
    case 'SET_KSTRIDE_SESSION':
      return { ...state, kstrideSession: action.payload };
    case 'SET_CURRENT_DATE':
      return { ...state, currentDate: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'COMPLETE_ONBOARDING':
      return { ...state, hasCompletedOnboarding: true };
    case 'RESET_APP':
      return initialState;
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  setUser: (user: UserProfile) => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
  setTrainingPlan: (plan: TrainingPlan) => Promise<void>;
  updateTrainingPlan: (updates: Partial<TrainingPlan>) => Promise<void>;
  addCheckIn: (checkIn: ActivityCheckIn) => Promise<void>;
  updateCheckIn: (date: string, updates: Partial<ActivityCheckIn>) => Promise<void>;
  deleteCheckIn: (date: string) => Promise<void>;
  addInjury: (injury: InjuryLog) => Promise<void>;
  resolveInjury: (id: string) => Promise<void>;
  addShoe: (shoe: RunningShoe) => Promise<void>;
  updateShoe: (shoe: RunningShoe) => Promise<void>;
  setHydrationLog: (log: HydrationLog) => Promise<void>;
  addBodyWeight: (entry: BodyWeightEntry) => Promise<void>;
  addRoute: (route: SavedRoute) => Promise<void>;
  deleteRoute: (id: string) => Promise<void>;
  addRaceEvent: (event: RaceEvent) => Promise<void>;
  updateRaceEvent: (event: RaceEvent) => Promise<void>;
  deleteRaceEvent: (id: string) => Promise<void>;
  addBenchmark: (result: BenchmarkResult) => Promise<void>;
  deleteBenchmark: (id: string) => Promise<void>;
  setKStrideSession: (session: KStrideSession | null) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetApp: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => { loadInitialData(); }, []);

  useEffect(() => {
    if (!state.isLoading) { persistData(); }
  }, [
    state.user, state.trainingPlan, state.checkIns, state.injuries, state.shoes,
    state.hydrationLogs, state.bodyWeightEntries, state.savedRoutes,
    state.raceEvents, state.benchmarkResults, state.kstrideSession,
    state.hasCompletedOnboarding,
  ]);

  async function loadInitialData() {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const data = await StorageService.loadAllData();
      if (data.userProfile) dispatch({ type: 'SET_USER', payload: data.userProfile });
      if (data.trainingPlan) dispatch({ type: 'SET_TRAINING_PLAN', payload: data.trainingPlan });
      if (data.checkIns) dispatch({ type: 'SET_CHECK_INS', payload: data.checkIns });
      if (data.injuries?.length) dispatch({ type: 'SET_INJURIES', payload: data.injuries });
      if (data.shoes?.length) dispatch({ type: 'SET_SHOES', payload: data.shoes });
      if (data.hydrationLogs) dispatch({ type: 'SET_HYDRATION_LOGS', payload: data.hydrationLogs });
      if (data.bodyWeightEntries?.length) dispatch({ type: 'SET_BODY_WEIGHTS', payload: data.bodyWeightEntries });
      if (data.savedRoutes?.length) dispatch({ type: 'SET_ROUTES', payload: data.savedRoutes });
      if (data.raceEvents?.length) dispatch({ type: 'SET_RACE_EVENTS', payload: data.raceEvents });
      if (data.benchmarkResults?.length) dispatch({ type: 'SET_BENCHMARKS', payload: data.benchmarkResults });
      if (data.kstrideSession) dispatch({ type: 'SET_KSTRIDE_SESSION', payload: data.kstrideSession });
      if (data.hasCompletedOnboarding) dispatch({ type: 'COMPLETE_ONBOARDING' });
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }

  async function persistData() {
    try {
      if (state.user) await StorageService.saveUserProfile(state.user);
      if (state.trainingPlan) await StorageService.saveTrainingPlan(state.trainingPlan);
      await StorageService.saveCheckIns(state.checkIns);
      await StorageService.saveInjuries(state.injuries);
      await StorageService.saveShoes(state.shoes);
      await StorageService.saveHydrationLogs(state.hydrationLogs);
      await StorageService.saveBodyWeights(state.bodyWeightEntries);
      await StorageService.saveSavedRoutes(state.savedRoutes);
      await StorageService.saveRaceEvents(state.raceEvents);
      await StorageService.saveBenchmarks(state.benchmarkResults);
      await StorageService.saveKStrideSession(state.kstrideSession);
      if (state.hasCompletedOnboarding) await StorageService.setOnboardingComplete(true);
    } catch (error) {
      console.error('Error persisting data:', error);
    }
  }

  const setUser = async (user: UserProfile) => { dispatch({ type: 'SET_USER', payload: user }); await StorageService.saveUserProfile(user); };
  const updateUser = async (updates: Partial<UserProfile>) => { dispatch({ type: 'UPDATE_USER', payload: updates }); await StorageService.updateUserProfile(updates); };
  const setTrainingPlan = async (plan: TrainingPlan) => { dispatch({ type: 'SET_TRAINING_PLAN', payload: plan }); await StorageService.saveTrainingPlan(plan); };
  const updateTrainingPlan = async (updates: Partial<TrainingPlan>) => { dispatch({ type: 'UPDATE_TRAINING_PLAN', payload: updates }); await StorageService.updateTrainingPlan(updates); };
  const addCheckIn = async (checkIn: ActivityCheckIn) => { dispatch({ type: 'ADD_CHECK_IN', payload: checkIn }); await StorageService.addCheckIn(checkIn); };
  const updateCheckIn = async (date: string, updates: Partial<ActivityCheckIn>) => { dispatch({ type: 'UPDATE_CHECK_IN', payload: { date, checkIn: updates } }); await StorageService.updateCheckIn(date, updates); };
  const deleteCheckIn = async (date: string) => { dispatch({ type: 'DELETE_CHECK_IN', payload: date }); await StorageService.deleteCheckIn(date); };
  const addInjury = async (injury: InjuryLog) => { dispatch({ type: 'ADD_INJURY', payload: injury }); await StorageService.addInjury(injury); };
  const resolveInjury = async (id: string) => { dispatch({ type: 'RESOLVE_INJURY', payload: id }); await StorageService.resolveInjury(id); };
  const addShoe = async (shoe: RunningShoe) => { dispatch({ type: 'ADD_SHOE', payload: shoe }); await StorageService.addShoe(shoe); };
  const updateShoe = async (shoe: RunningShoe) => { dispatch({ type: 'UPDATE_SHOE', payload: shoe }); await StorageService.updateShoe(shoe); };
  const setHydrationLog = async (log: HydrationLog) => { dispatch({ type: 'SET_HYDRATION_LOG', payload: log }); await StorageService.setHydrationLog(log); };
  const addBodyWeight = async (entry: BodyWeightEntry) => { dispatch({ type: 'ADD_BODY_WEIGHT', payload: entry }); await StorageService.addBodyWeight(entry); };
  const addRoute = async (route: SavedRoute) => { dispatch({ type: 'ADD_ROUTE', payload: route }); await StorageService.addSavedRoute(route); };
  const deleteRoute = async (id: string) => { dispatch({ type: 'DELETE_ROUTE', payload: id }); await StorageService.deleteSavedRoute(id); };
  const addRaceEvent = async (event: RaceEvent) => { dispatch({ type: 'ADD_RACE_EVENT', payload: event }); await StorageService.addRaceEvent(event); };
  const updateRaceEvent = async (event: RaceEvent) => { dispatch({ type: 'UPDATE_RACE_EVENT', payload: event }); await StorageService.updateRaceEvent(event); };
  const deleteRaceEvent = async (id: string) => { dispatch({ type: 'DELETE_RACE_EVENT', payload: id }); await StorageService.deleteRaceEvent(id); };
  const addBenchmark = async (result: BenchmarkResult) => { dispatch({ type: 'ADD_BENCHMARK', payload: result }); await StorageService.addBenchmark(result); };
  const deleteBenchmark = async (id: string) => { dispatch({ type: 'DELETE_BENCHMARK', payload: id }); await StorageService.deleteBenchmark(id); };
  const setKStrideSession = async (session: KStrideSession | null) => { dispatch({ type: 'SET_KSTRIDE_SESSION', payload: session }); await StorageService.saveKStrideSession(session); };
  const completeOnboarding = async () => { dispatch({ type: 'COMPLETE_ONBOARDING' }); await StorageService.setOnboardingComplete(true); };
  const resetApp = async () => { dispatch({ type: 'RESET_APP' }); await StorageService.clearAllData(); };

  return (
    <AppContext.Provider value={{
      state, dispatch, setUser, updateUser, setTrainingPlan, updateTrainingPlan,
      addCheckIn, updateCheckIn, deleteCheckIn, addInjury, resolveInjury,
      addShoe, updateShoe, setHydrationLog, addBodyWeight, addRoute, deleteRoute,
      addRaceEvent, updateRaceEvent, deleteRaceEvent, addBenchmark, deleteBenchmark,
      setKStrideSession, completeOnboarding, resetApp,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
