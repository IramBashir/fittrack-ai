// context/AppContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useReducer,
    useState,
} from "react";

// ─── STORAGE KEYS ─────────────────────────────────────────
// One key per data type — keeps things organized
// We define them as constants so we never mistype a key string

const KEYS = {
  user: "fittrack_user",
  meals: "fittrack_meals",
  weightLog: "fittrack_weight_log",
  streak: "fittrack_streak",
  weeklyCalories: "fittrack_weekly_calories",
  lastOpenedDate: "fittrack_last_opened",
  onboarded: "fittrack_onboarded",
};

// ─── TYPES ────────────────────────────────────────────────

export type MealCategory = "breakfast" | "lunch" | "dinner" | "snack";

export type Meal = {
  id: string;
  name: string;
  calories: number;
  time: string;
  category: MealCategory;
};

export type WeightEntry = {
  date: string;
  weight: number;
};

export type Gender = "male" | "female" | "other";

export type User = {
  name: string;
  age: number;
  gender: Gender;
  heightCm: number; // height in centimeters
  currentWeight: number; // in kg
  calorieGoal: number; // daily calorie target
  waterGoal: number; // daily water goal in glasses
  stepsGoal: number; // daily steps goal
  // Tracked today
  waterToday: number; // glasses drunk today
  stepsToday: number; // steps taken today
};

export type AppState = {
  user: User;
  meals: Meal[];
  weightLog: WeightEntry[];
  streak: number;
  weeklyCalories: number[];
  isOnboarded: boolean;
};

// ─── ACTIONS ──────────────────────────────────────────────

type Action =
  | { type: "ADD_MEAL"; payload: Omit<Meal, "id"> }
  | { type: "DELETE_MEAL"; payload: string }
  | { type: "LOG_WEIGHT"; payload: number }
  | { type: "UPDATE_GOAL"; payload: number }
  | { type: "UPDATE_USER"; payload: Partial<User> }
  | { type: "ADD_WATER" }
  | { type: "REMOVE_WATER" }
  | { type: "UPDATE_STEPS"; payload: number }
  | { type: "LOAD_STATE"; payload: Partial<AppState> }
  | { type: "RESET_DAILY" }
  | { type: "COMPLETE_ONBOARDING" };
// LOAD_STATE → used once on startup to hydrate from AsyncStorage
// RESET_DAILY → resets daily trackers (water, steps, meals) at midnight

// ─── DEFAULT USER ─────────────────────────────────────────
// Used when app is opened for the first time (no saved data)

const DEFAULT_USER: User = {
  name: "User",
  age: 25,
  gender: "female",
  heightCm: 160,
  currentWeight: 60,
  calorieGoal: 1500,
  waterGoal: 8,
  stepsGoal: 8000,
  waterToday: 0,
  stepsToday: 0,
};

// ─── INITIAL STATE ────────────────────────────────────────

const initialState: AppState = {
  user: DEFAULT_USER,
  meals: [],
  weightLog: [
    { date: dayjs().subtract(6, "day").format("YYYY-MM-DD"), weight: 60 },
    { date: dayjs().subtract(5, "day").format("YYYY-MM-DD"), weight: 59.8 },
    { date: dayjs().subtract(4, "day").format("YYYY-MM-DD"), weight: 59.6 },
    { date: dayjs().subtract(3, "day").format("YYYY-MM-DD"), weight: 59.4 },
    { date: dayjs().subtract(2, "day").format("YYYY-MM-DD"), weight: 59.2 },
    { date: dayjs().subtract(1, "day").format("YYYY-MM-DD"), weight: 59.0 },
    { date: dayjs().format("YYYY-MM-DD"), weight: 58.8 },
  ],
  streak: 0,
  weeklyCalories: [0, 0, 0, 0, 0, 0, 0],
  isOnboarded: false,
};

// ─── HELPER: BMR + TDEE CALCULATION ──────────────────────
// BMR = Basal Metabolic Rate
// How many calories your body burns at complete rest
// Formula used: Mifflin-St Jeor (most accurate for general use)
//
// For females: BMR = (10 × weight) + (6.25 × height) − (5 × age) − 161
// For males:   BMR = (10 × weight) + (6.25 × height) − (5 × age) + 5
//
// TDEE = BMR × activity multiplier
// We assume "lightly active" (1.375) as a safe default

export function calculateTDEE(user: User): number {
  const { currentWeight, heightCm, age, gender } = user;
  const bmr =
    gender === "male"
      ? 10 * currentWeight + 6.25 * heightCm - 5 * age + 5
      : 10 * currentWeight + 6.25 * heightCm - 5 * age - 161;
  return Math.round(bmr * 1.375); // lightly active
}

// BMI = weight(kg) / height(m)²
export function calculateBMI(user: User): number {
  const heightM = user.heightCm / 100;
  return Number((user.currentWeight / (heightM * heightM)).toFixed(1));
}

export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

export function getBMIColor(bmi: number): string {
  if (bmi < 18.5) return "#7C6EF8"; // purple
  if (bmi < 25) return "#00E5A0"; // green
  if (bmi < 30) return "#FFB347"; // orange
  return "#FF4D6A"; // red
}

// ─── REDUCER ──────────────────────────────────────────────

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "LOAD_STATE":
      // Merge loaded data with initial state
      // This way if we add new fields later, they get defaults
      return {
        ...state,
        ...action.payload,
        user: { ...DEFAULT_USER, ...action.payload.user },
      };

    case "ADD_MEAL": {
      const newMeals = [
        ...state.meals,
        { ...action.payload, id: Date.now().toString() },
      ];
      // Update today's slot in weeklyCalories
      const dayIndex = dayjs().day();
      // dayjs().day() returns 0=Sun, 1=Mon... 6=Sat
      const newWeekly = [...state.weeklyCalories];
      newWeekly[dayIndex] =
        (newWeekly[dayIndex] || 0) + action.payload.calories;

      return { ...state, meals: newMeals, weeklyCalories: newWeekly };
    }

    case "DELETE_MEAL": {
      const deleted = state.meals.find((m) => m.id === action.payload);
      const newMeals = state.meals.filter((m) => m.id !== action.payload);
      // Subtract deleted meal's calories from today's weekly slot
      const dayIndex = dayjs().day();
      const newWeekly = [...state.weeklyCalories];
      if (deleted) {
        newWeekly[dayIndex] = Math.max(
          0,
          (newWeekly[dayIndex] || 0) - deleted.calories,
        );
      }
      return { ...state, meals: newMeals, weeklyCalories: newWeekly };
    }

    case "LOG_WEIGHT": {
      const today = dayjs().format("YYYY-MM-DD");
      const existingIndex = state.weightLog.findIndex((w) => w.date === today);
      const newLog =
        existingIndex >= 0
          ? state.weightLog.map((w, i) =>
              i === existingIndex ? { ...w, weight: action.payload } : w,
            )
          : [...state.weightLog, { date: today, weight: action.payload }];

      return {
        ...state,
        weightLog: newLog,
        user: { ...state.user, currentWeight: action.payload },
      };
    }

    case "UPDATE_GOAL":
      return {
        ...state,
        user: { ...state.user, calorieGoal: action.payload },
      };

    case "UPDATE_USER":
      // Partial<User> means we only pass the fields we want to change
      // The rest stay the same thanks to spread operator
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

    case "ADD_WATER":
      return {
        ...state,
        user: {
          ...state.user,
          waterToday: Math.min(
            state.user.waterToday + 1,
            20, // cap at 20 glasses
          ),
        },
      };

    case "REMOVE_WATER":
      return {
        ...state,
        user: {
          ...state.user,
          waterToday: Math.max(state.user.waterToday - 1, 0),
          // Math.max prevents going below 0
        },
      };

    case "UPDATE_STEPS":
      return {
        ...state,
        user: { ...state.user, stepsToday: action.payload },
      };

    case "RESET_DAILY": {
      // Get today's day index to reset its calorie slot
      const todayIndex = dayjs().day();
      const resetWeekly = [...state.weeklyCalories];
      resetWeekly[todayIndex] = 0;
      // Reset today's slot to 0 for fresh tracking

      return {
        ...state,
        meals: [],
        weeklyCalories: resetWeekly,
        user: {
          ...state.user,
          waterToday: 0,
          stepsToday: 0,
        },
      };
    }

    default:
      return state;
  }
}

// ─── CONTEXT TYPE ─────────────────────────────────────────

type AppContextType = {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  totalCaloriesToday: number;
  remainingCalories: number;
  caloriePercent: number;
  isLoading: boolean; // true while loading from AsyncStorage
  isOnboarded: boolean;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

// ─── PROVIDER ─────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isLoading, setIsLoading] = useState(true);
  // isLoading prevents the app from flashing default data
  // before saved data loads

  // ── Load saved data on startup ──────────────────────────
  useEffect(() => {
    loadFromStorage();
  }, []); // empty array = run once on mount

  // ── Save data whenever state changes ───────────────────
  useEffect(() => {
    if (!isLoading) {
      // Don't save during initial load — we'd overwrite saved data
      saveToStorage();
    }
  }, [state, isLoading]);

  // ── Check if it's a new day ─────────────────────────────
  useEffect(() => {
    checkNewDay();
  }, []);

  // ── Storage functions ───────────────────────────────────

  const loadFromStorage = async () => {
    try {
      // Load all keys in parallel using Promise.all
      // Much faster than loading one by one
      const [userRaw, mealsRaw, weightRaw, streakRaw, weeklyRaw] =
        await Promise.all([
          AsyncStorage.getItem(KEYS.user),
          AsyncStorage.getItem(KEYS.meals),
          AsyncStorage.getItem(KEYS.weightLog),
          AsyncStorage.getItem(KEYS.streak),
          AsyncStorage.getItem(KEYS.weeklyCalories),
        ]);

      // Build partial state from whatever was saved
      // If a key was never saved (first launch), use undefined
      // LOAD_STATE reducer handles undefined gracefully
      const loaded: Partial<AppState> = {};

      if (userRaw) loaded.user = JSON.parse(userRaw);
      if (mealsRaw) loaded.meals = JSON.parse(mealsRaw);
      if (weightRaw) loaded.weightLog = JSON.parse(weightRaw);
      if (streakRaw) loaded.streak = JSON.parse(streakRaw);
      if (weeklyRaw) loaded.weeklyCalories = JSON.parse(weeklyRaw);

      const onboardedRaw = await AsyncStorage.getItem(KEYS.onboarded);
      if (onboardedRaw) loaded.isOnboarded = JSON.parse(onboardedRaw);

      // Only dispatch if we actually had saved data
      if (Object.keys(loaded).length > 0) {
        dispatch({ type: "LOAD_STATE", payload: loaded });
      }
    } catch (error) {
      console.error("Failed to load from storage:", error);
      // If loading fails, app just uses initial state — no crash
    } finally {
      setIsLoading(false);
      // Always set loading false, even if there was an error
    }
  };

  const saveToStorage = async () => {
    try {
      // Save all keys in parallel
      await Promise.all([
        AsyncStorage.setItem(KEYS.onboarded, JSON.stringify(state.isOnboarded)),
        AsyncStorage.setItem(KEYS.user, JSON.stringify(state.user)),
        AsyncStorage.setItem(KEYS.meals, JSON.stringify(state.meals)),
        AsyncStorage.setItem(KEYS.weightLog, JSON.stringify(state.weightLog)),
        AsyncStorage.setItem(KEYS.streak, JSON.stringify(state.streak)),
        AsyncStorage.setItem(
          KEYS.weeklyCalories,
          JSON.stringify(state.weeklyCalories),
        ),
      ]);
    } catch (error) {
      console.error("Failed to save to storage:", error);
    }
  };

  const checkNewDay = async () => {
    try {
      const lastOpened = await AsyncStorage.getItem(KEYS.lastOpenedDate);
      const today = dayjs().format("YYYY-MM-DD");

      if (lastOpened && lastOpened !== today) {
        // ── It's a new day ──────────────────────────

        // Load yesterday's calorie data to check streak
        // We stored weeklyCalories in state — but state
        // might not be loaded yet at this point, so we
        // read directly from AsyncStorage to be safe
        const weeklyRaw = await AsyncStorage.getItem(KEYS.weeklyCalories);
        const streakRaw = await AsyncStorage.getItem(KEYS.streak);
        const userRaw = await AsyncStorage.getItem(KEYS.user);

        const weekly = weeklyRaw
          ? JSON.parse(weeklyRaw)
          : [0, 0, 0, 0, 0, 0, 0];
        const streak = streakRaw ? JSON.parse(streakRaw) : 0;
        const user = userRaw ? JSON.parse(userRaw) : null;

        if (user) {
          // Get yesterday's day index
          // dayjs().subtract(1,'day').day() = yesterday
          // day() returns 0=Sun, 1=Mon... 6=Sat
          const yesterdayIndex = dayjs().subtract(1, "day").day();
          const yesterdayCalories = weekly[yesterdayIndex] || 0;
          const calorieGoal = user.calorieGoal || 1500;

          // Check if yesterday was under goal
          const wasUnderGoal =
            yesterdayCalories > 0 && yesterdayCalories <= calorieGoal;
          // yesterdayCalories > 0 means user actually logged something
          // We don't reward streak for days where nothing was logged

          const newStreak = wasUnderGoal ? streak + 1 : 0;

          // Save new streak to AsyncStorage directly
          // so it's ready before state loads
          await AsyncStorage.setItem(KEYS.streak, JSON.stringify(newStreak));
        }

        // Reset today's daily trackers
        dispatch({ type: "RESET_DAILY" });
      }

      // Save today's date as last opened
      await AsyncStorage.setItem(KEYS.lastOpenedDate, today);
    } catch (error) {
      console.error("Failed to check new day:", error);
    }
  };

  // ── Computed values ─────────────────────────────────────

  const totalCaloriesToday = state.meals.reduce(
    (sum, meal) => sum + meal.calories,
    0,
  );
  const remainingCalories = state.user.calorieGoal - totalCaloriesToday;
  const caloriePercent = Math.min(
    totalCaloriesToday / state.user.calorieGoal,
    1,
  );

  // ── Loading screen ──────────────────────────────────────
  // While loading, render nothing (prevents flash of default data)
  if (isLoading) return null;

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        totalCaloriesToday,
        remainingCalories,
        caloriePercent,
        isLoading,
        isOnboarded: state.isOnboarded,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// ─── HOOK ─────────────────────────────────────────────────

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used inside AppProvider");
  }
  return context;
}
