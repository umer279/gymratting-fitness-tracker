export enum ExerciseCategory {
  CHEST = 'Chest',
  BACK = 'Back',
  BICEPS = 'Biceps',
  TRICEPS = 'Triceps',
  LEGS = 'Legs',
  SHOULDERS = 'Shoulders',
  CARDIO = 'Cardio',
  CORE = 'Core',
}

export enum ExerciseType {
  STRENGTH = 'Strength',
  CARDIO = 'Cardio',
}

export interface Profile {
  id: string; // This MUST match the auth.users.id
  name: string;
  avatar: string;
}

export interface Exercise {
  id: string;
  user_id: string;
  name: string;
  category: ExerciseCategory;
  exerciseType: ExerciseType;
}

export interface PlanExercise {
  exerciseId: string;
  // For Strength
  numberOfSets?: number;
  repRange?: string;
  targetWeight?: number;
  // For Cardio
  duration?: number; // Target duration in seconds
  // Common notes
  notes?: string;
}

export interface WorkoutPlan {
  id: string;
  user_id: string;
  name: string;
  exercises: PlanExercise[];
}

export interface PerformedSet {
  weight: number;
  reps: number;
}

export interface CardioPerformance {
  duration: number; // actual duration in seconds
  distance?: number; // e.g. in km
}

export interface PerformedExercise {
  exerciseId: string;
  notes?: string; // from the session
  // For Strength
  sets?: PerformedSet[];
  // For Cardio
  cardioPerformance?: CardioPerformance;
}

export interface WorkoutHistory {
  id:string;
  user_id: string;
  planName: string;
  planId: string;
  date: string; // ISO string
  exercises: PerformedExercise[];
  duration: number; // in seconds
}