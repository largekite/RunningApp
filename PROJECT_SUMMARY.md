# 50-Mile Training App - Project Summary

## Overview
A React Native mobile app designed for ultramarathon training, specifically targeting the 50-mile distance. The app features adaptive workout planning that adjusts based on user check-ins, along with integrated nutrition and sleep tracking.

## ✅ Implemented Features

### Core Functionality
- **Adaptive Training Plan Generator**: Creates personalized 16-22 week training plans based on:
  - Current fitness level (weekly mileage, longest run)
  - Experience level (beginner, intermediate, advanced)
  - Race date
  - Training phases: Base Building → Build → Peak → Taper

- **Intelligent Workout Adaptation**: Automatically adjusts future workouts based on:
  - Rate of Perceived Effort (RPE)
  - Sleep quality and hours
  - Completion rate
  - Weekly mileage progression
  - Consecutive missed workouts

- **Nutrition Recommendations**: Context-aware tips based on workout type:
  - Long run fueling strategies (30-60g carbs/hour)
  - Pre-run meal suggestions
  - Post-run recovery nutrition
  - Hydration calculations
  - Timing recommendations

- **Sleep Tracking & Recommendations**: Personalized sleep targets based on:
  - Weekly mileage load
  - Upcoming workout intensity
  - Recent sleep debt
  - Sleep quality scores

### Screens
1. **Onboarding** - Collects user profile and generates training plan
2. **Home (Today)** - Displays:
   - Today's workout with targets
   - Workout modifications (if adapted)
   - Nutrition tip for the workout type
   - Sleep recommendation for tonight
   - Weekly progress summary
3. **Check-In** - Logs completed workouts with:
   - Distance, duration, pace
   - RPE (1-5 scale)
   - Sleep hours and quality
   - Nutrition score
   - Notes
4. **Calendar** - Weekly view showing planned vs completed workouts
5. **Progress** - Overall statistics:
   - Total miles run
   - Longest run to date
   - Completion rate
   - Average RPE and sleep
6. **Settings** - Profile, preferences, and app reset

### Technical Architecture
- **State Management**: React Context API with useReducer
- **Data Persistence**: AsyncStorage (local, offline-first)
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **UI Framework**: React Native Paper (Material Design)
- **TypeScript**: Fully typed for type safety

## 📁 Project Structure
```
src/
├── components/          # Reusable UI components (future)
├── context/
│   ├── AppContext.tsx   # Global state management
│   └── types.ts         # TypeScript interfaces
├── screens/
│   ├── OnboardingScreen.tsx
│   ├── HomeScreen.tsx
│   ├── CheckInScreen.tsx
│   ├── CalendarScreen.tsx
│   ├── ProgressScreen.tsx
│   └── SettingsScreen.tsx
├── services/
│   ├── storage.service.ts      # AsyncStorage wrapper
│   ├── adaptation.service.ts   # Adaptive algorithm
│   └── nutrition.service.ts    # Nutrition recommendations
├── utils/
│   ├── dateHelpers.ts          # Date manipulation
│   ├── paceCalculator.ts       # Pace calculations
│   └── trainingPlanGenerator.ts # Plan generation
├── constants/
│   ├── nutritionTips.ts        # Nutrition database
│   └── sleepGuidelines.ts      # Sleep recommendations
└── navigation/
    └── AppNavigator.tsx         # Navigation setup
```

## 🚀 Running the App

### iOS
```bash
cd RunningApp
npm install
cd ios && pod install && cd ..
npm run ios
```

### Android
```bash
cd RunningApp
npm install
npm run android
```

## 🎯 Key Algorithms

### Training Plan Generation
- Progressive mileage increase following 10% rule
- Periodization: Base (40%) → Build (35%) → Peak (15%) → Taper (10%)
- Long run progression: builds from current longest to 40 miles
- Recovery weeks every 4th week

### Adaptive Workout Algorithm
The app adjusts workouts based on 7 rules:
1. Poor sleep (<6 hours) → Converts hard workouts to recovery
2. High RPE + recent hard efforts → Reduces intensity
3. 2+ consecutive missed workouts → Reduces volume by 30%
4. <60% completion rate → Reduces volume by 20%
5. >15% weekly mileage increase → Reduces to prevent injury
6. Consistent low RPE (<2.5) → Slightly increases pace
7. Poor nutrition → Adds nutrition reminders

### Nutrition System
- 13+ context-specific tips for all workout types
- Hydration calculator based on distance
- Macro recommendations for endurance athletes
- Pre-run, during-run, and post-run guidance

### Sleep System
- Dynamic sleep targets (7.5-9 hours) based on training load
- Sleep debt tracking
- Pre-long run and pre-hard workout recommendations
- Sleep hygiene tips

## 📊 Data Models
- **UserProfile**: Name, experience, current fitness, preferences
- **TrainingPlan**: 16-22 weeks of structured workouts
- **DailyWorkout**: Type, distance, pace, notes, modification status
- **ActivityCheckIn**: Completed workout data, RPE, sleep, nutrition
- **WeeklySummary**: Stats for completed weeks

## 🔄 Workflow Example
1. User completes onboarding → 18-week plan generated
2. Each day: View workout, nutrition tip, sleep target on Home screen
3. After workout: Log check-in with distance, RPE, sleep, nutrition
4. Algorithm runs: Analyzes last 7 days of check-ins
5. Tomorrow's workout: Automatically adjusted if needed
6. Weekly: View progress stats and completion rate
7. Race day: 50-mile ultra ready!

## 🎨 Design Choices
- **Material Design**: Clean, familiar UI with React Native Paper
- **Offline-First**: All data stored locally with AsyncStorage
- **Adaptive UX**: Workouts adapt to user's actual performance, not just the plan
- **Holistic Approach**: Training isn't just miles—sleep and nutrition matter
- **Progressive Enhancement**: Core features work now, room for future additions

## 🚧 Future Enhancements (Not Yet Implemented)
- GPS tracking for actual routes
- Weekly summary charts (react-native-chart-kit integration)
- Push notifications for workout reminders
- Export/import training plans
- Integration with Strava/Garmin
- Weather-based adjustments
- Community features
- Cloud sync across devices

## 🧪 Testing Checklist
- [ ] Complete onboarding flow
- [ ] Generate training plan
- [ ] View today's workout
- [ ] Complete check-in with low sleep → tomorrow adapts
- [ ] Skip 2 workouts → next workout volume reduces
- [ ] View weekly calendar
- [ ] Check progress stats
- [ ] Reset app in settings

## 📝 Notes
- Training plan generation is based on established ultramarathon training principles
- Adaptation algorithm prioritizes injury prevention over performance
- All recommendations are general guidelines—users should consult coaches/doctors
- The app encourages consistency and listening to your body

## 🛠️ Dependencies
- react-native (0.84.0)
- @react-navigation/native
- @react-navigation/stack
- @react-navigation/bottom-tabs
- @react-native-async-storage/async-storage
- react-native-paper
- react-native-safe-area-context
- react-native-gesture-handler
- react-native-screens
- react-native-vector-icons
- @react-native-community/slider
- date-fns
- react-native-uuid

---

**Built for ultrarunners, by Claude**
