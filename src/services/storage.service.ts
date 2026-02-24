import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, TrainingPlan, ActivityCheckIn, AppState } from '../context/types';

// Storage Keys
const KEYS = {
  USER_PROFILE: '@RunningApp:userProfile',
  TRAINING_PLAN: '@RunningApp:trainingPlan',
  CHECK_INS: '@RunningApp:checkIns',
  ONBOARDING_COMPLETE: '@RunningApp:onboardingComplete',
  APP_STATE: '@RunningApp:appState',
};

/**
 * Storage Service
 * Handles all AsyncStorage operations for the app
 */
class StorageService {
  // User Profile Operations
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(KEYS.USER_PROFILE);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  async saveUserProfile(profile: UserProfile): Promise<boolean> {
    try {
      const jsonValue = JSON.stringify(profile);
      await AsyncStorage.setItem(KEYS.USER_PROFILE, jsonValue);
      return true;
    } catch (error) {
      console.error('Error saving user profile:', error);
      return false;
    }
  }

  async updateUserProfile(updates: Partial<UserProfile>): Promise<boolean> {
    try {
      const current = await this.getUserProfile();
      if (!current) {
        return false;
      }
      const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
      return await this.saveUserProfile(updated);
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  }

  // Training Plan Operations
  async getTrainingPlan(): Promise<TrainingPlan | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(KEYS.TRAINING_PLAN);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error getting training plan:', error);
      return null;
    }
  }

  async saveTrainingPlan(plan: TrainingPlan): Promise<boolean> {
    try {
      const jsonValue = JSON.stringify(plan);
      await AsyncStorage.setItem(KEYS.TRAINING_PLAN, jsonValue);
      return true;
    } catch (error) {
      console.error('Error saving training plan:', error);
      return false;
    }
  }

  async updateTrainingPlan(updates: Partial<TrainingPlan>): Promise<boolean> {
    try {
      const current = await this.getTrainingPlan();
      if (!current) {
        return false;
      }
      const updated = { ...current, ...updates };
      return await this.saveTrainingPlan(updated);
    } catch (error) {
      console.error('Error updating training plan:', error);
      return false;
    }
  }

  // Check-In Operations
  async getCheckIns(): Promise<{ [date: string]: ActivityCheckIn }> {
    try {
      const jsonValue = await AsyncStorage.getItem(KEYS.CHECK_INS);
      return jsonValue != null ? JSON.parse(jsonValue) : {};
    } catch (error) {
      console.error('Error getting check-ins:', error);
      return {};
    }
  }

  async saveCheckIns(checkIns: { [date: string]: ActivityCheckIn }): Promise<boolean> {
    try {
      const jsonValue = JSON.stringify(checkIns);
      await AsyncStorage.setItem(KEYS.CHECK_INS, jsonValue);
      return true;
    } catch (error) {
      console.error('Error saving check-ins:', error);
      return false;
    }
  }

  async addCheckIn(checkIn: ActivityCheckIn): Promise<boolean> {
    try {
      const checkIns = await this.getCheckIns();
      checkIns[checkIn.date] = checkIn;
      return await this.saveCheckIns(checkIns);
    } catch (error) {
      console.error('Error adding check-in:', error);
      return false;
    }
  }

  async updateCheckIn(date: string, updates: Partial<ActivityCheckIn>): Promise<boolean> {
    try {
      const checkIns = await this.getCheckIns();
      if (!checkIns[date]) {
        return false;
      }
      checkIns[date] = { ...checkIns[date], ...updates, updatedAt: new Date().toISOString() };
      return await this.saveCheckIns(checkIns);
    } catch (error) {
      console.error('Error updating check-in:', error);
      return false;
    }
  }

  async deleteCheckIn(date: string): Promise<boolean> {
    try {
      const checkIns = await this.getCheckIns();
      delete checkIns[date];
      return await this.saveCheckIns(checkIns);
    } catch (error) {
      console.error('Error deleting check-in:', error);
      return false;
    }
  }

  async getCheckIn(date: string): Promise<ActivityCheckIn | null> {
    try {
      const checkIns = await this.getCheckIns();
      return checkIns[date] || null;
    } catch (error) {
      console.error('Error getting check-in:', error);
      return null;
    }
  }

  // Onboarding
  async hasCompletedOnboarding(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(KEYS.ONBOARDING_COMPLETE);
      return value === 'true';
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  }

  async setOnboardingComplete(complete: boolean): Promise<boolean> {
    try {
      await AsyncStorage.setItem(KEYS.ONBOARDING_COMPLETE, complete.toString());
      return true;
    } catch (error) {
      console.error('Error setting onboarding status:', error);
      return false;
    }
  }

  // Full App State Operations (for complete persistence)
  async getAppState(): Promise<Partial<AppState> | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(KEYS.APP_STATE);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error getting app state:', error);
      return null;
    }
  }

  async saveAppState(state: Partial<AppState>): Promise<boolean> {
    try {
      const jsonValue = JSON.stringify(state);
      await AsyncStorage.setItem(KEYS.APP_STATE, jsonValue);
      return true;
    } catch (error) {
      console.error('Error saving app state:', error);
      return false;
    }
  }

  // Utility: Load all data
  async loadAllData(): Promise<{
    userProfile: UserProfile | null;
    trainingPlan: TrainingPlan | null;
    checkIns: { [date: string]: ActivityCheckIn };
    hasCompletedOnboarding: boolean;
  }> {
    const [userProfile, trainingPlan, checkIns, hasCompletedOnboarding] = await Promise.all([
      this.getUserProfile(),
      this.getTrainingPlan(),
      this.getCheckIns(),
      this.hasCompletedOnboarding(),
    ]);

    return {
      userProfile,
      trainingPlan,
      checkIns,
      hasCompletedOnboarding,
    };
  }

  // Utility: Clear all data (for debugging or reset)
  async clearAllData(): Promise<boolean> {
    try {
      await AsyncStorage.multiRemove([
        KEYS.USER_PROFILE,
        KEYS.TRAINING_PLAN,
        KEYS.CHECK_INS,
        KEYS.ONBOARDING_COMPLETE,
        KEYS.APP_STATE,
      ]);
      return true;
    } catch (error) {
      console.error('Error clearing all data:', error);
      return false;
    }
  }
}

// Export singleton instance
export default new StorageService();
