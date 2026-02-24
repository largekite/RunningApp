import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
  AppState,
  AppAction,
  UserProfile,
  TrainingPlan,
  ActivityCheckIn,
} from './types';
import StorageService from '../services/storage.service';

// Initial State
const initialState: AppState = {
  user: null,
  trainingPlan: null,
  checkIns: {},
  currentDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
  isLoading: true,
  hasCompletedOnboarding: false,
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };

    case 'UPDATE_USER':
      if (!state.user) return state;
      return {
        ...state,
        user: { ...state.user, ...action.payload, updatedAt: new Date().toISOString() },
      };

    case 'SET_TRAINING_PLAN':
      return { ...state, trainingPlan: action.payload };

    case 'UPDATE_TRAINING_PLAN':
      if (!state.trainingPlan) return state;
      return {
        ...state,
        trainingPlan: { ...state.trainingPlan, ...action.payload },
      };

    case 'ADD_CHECK_IN':
      return {
        ...state,
        checkIns: { ...state.checkIns, [action.payload.date]: action.payload },
      };

    case 'UPDATE_CHECK_IN': {
      const { date, checkIn } = action.payload;
      if (!state.checkIns[date]) return state;
      return {
        ...state,
        checkIns: {
          ...state.checkIns,
          [date]: { ...state.checkIns[date], ...checkIn, updatedAt: new Date().toISOString() },
        },
      };
    }

    case 'DELETE_CHECK_IN': {
      const newCheckIns = { ...state.checkIns };
      delete newCheckIns[action.payload];
      return { ...state, checkIns: newCheckIns };
    }

    case 'SET_CHECK_INS':
      return { ...state, checkIns: action.payload };

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

// Context Type
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Helper functions for common operations
  setUser: (user: UserProfile) => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
  setTrainingPlan: (plan: TrainingPlan) => Promise<void>;
  updateTrainingPlan: (updates: Partial<TrainingPlan>) => Promise<void>;
  addCheckIn: (checkIn: ActivityCheckIn) => Promise<void>;
  updateCheckIn: (date: string, updates: Partial<ActivityCheckIn>) => Promise<void>;
  deleteCheckIn: (date: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetApp: () => Promise<void>;
}

// Create Context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider Component
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load data from storage on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Persist state changes to storage
  useEffect(() => {
    if (!state.isLoading) {
      persistData();
    }
  }, [state.user, state.trainingPlan, state.checkIns, state.hasCompletedOnboarding]);

  async function loadInitialData() {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const data = await StorageService.loadAllData();

      if (data.userProfile) {
        dispatch({ type: 'SET_USER', payload: data.userProfile });
      }

      if (data.trainingPlan) {
        dispatch({ type: 'SET_TRAINING_PLAN', payload: data.trainingPlan });
      }

      if (data.checkIns) {
        dispatch({ type: 'SET_CHECK_INS', payload: data.checkIns });
      }

      if (data.hasCompletedOnboarding) {
        dispatch({ type: 'COMPLETE_ONBOARDING' });
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }

  async function persistData() {
    try {
      // Persist each piece of data independently
      if (state.user) {
        await StorageService.saveUserProfile(state.user);
      }

      if (state.trainingPlan) {
        await StorageService.saveTrainingPlan(state.trainingPlan);
      }

      await StorageService.saveCheckIns(state.checkIns);

      if (state.hasCompletedOnboarding) {
        await StorageService.setOnboardingComplete(true);
      }
    } catch (error) {
      console.error('Error persisting data:', error);
    }
  }

  // Helper Functions
  const setUser = async (user: UserProfile) => {
    dispatch({ type: 'SET_USER', payload: user });
    await StorageService.saveUserProfile(user);
  };

  const updateUser = async (updates: Partial<UserProfile>) => {
    dispatch({ type: 'UPDATE_USER', payload: updates });
    await StorageService.updateUserProfile(updates);
  };

  const setTrainingPlan = async (plan: TrainingPlan) => {
    dispatch({ type: 'SET_TRAINING_PLAN', payload: plan });
    await StorageService.saveTrainingPlan(plan);
  };

  const updateTrainingPlan = async (updates: Partial<TrainingPlan>) => {
    dispatch({ type: 'UPDATE_TRAINING_PLAN', payload: updates });
    await StorageService.updateTrainingPlan(updates);
  };

  const addCheckIn = async (checkIn: ActivityCheckIn) => {
    dispatch({ type: 'ADD_CHECK_IN', payload: checkIn });
    await StorageService.addCheckIn(checkIn);
  };

  const updateCheckIn = async (date: string, updates: Partial<ActivityCheckIn>) => {
    dispatch({ type: 'UPDATE_CHECK_IN', payload: { date, checkIn: updates } });
    await StorageService.updateCheckIn(date, updates);
  };

  const deleteCheckIn = async (date: string) => {
    dispatch({ type: 'DELETE_CHECK_IN', payload: date });
    await StorageService.deleteCheckIn(date);
  };

  const completeOnboarding = async () => {
    dispatch({ type: 'COMPLETE_ONBOARDING' });
    await StorageService.setOnboardingComplete(true);
  };

  const resetApp = async () => {
    dispatch({ type: 'RESET_APP' });
    await StorageService.clearAllData();
  };

  const contextValue: AppContextType = {
    state,
    dispatch,
    setUser,
    updateUser,
    setTrainingPlan,
    updateTrainingPlan,
    addCheckIn,
    updateCheckIn,
    deleteCheckIn,
    completeOnboarding,
    resetApp,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

// Custom Hook
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
