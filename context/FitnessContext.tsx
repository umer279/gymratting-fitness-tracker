
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Exercise, WorkoutPlan, WorkoutHistory, Profile } from '../types';
import { supabase } from '../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

// Combined state
interface FitnessState {
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  exercises: Exercise[];
  plans: WorkoutPlan[];
  history: WorkoutHistory[];
}

type FitnessAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SESSION_AND_PROFILE'; payload: { session: Session | null; profile: Profile | null } }
  | { type: 'SET_USER_DATA'; payload: { exercises: Exercise[]; plans: WorkoutPlan[]; history: WorkoutHistory[] } }
  | { type: 'UPDATE_PROFILE_LOCALLY'; payload: Profile }
  | { type: 'ADD_EXERCISE'; payload: Exercise }
  | { type: 'DELETE_EXERCISE'; payload: string }
  | { type: 'ADD_PLAN'; payload: WorkoutPlan }
  | { type: 'UPDATE_PLAN'; payload: WorkoutPlan }
  | { type: 'DELETE_PLAN'; payload: string }
  | { type: 'ADD_WORKOUT_TO_HISTORY'; payload: WorkoutHistory }
  | { type: 'DELETE_WORKOUT_FROM_HISTORY'; payload: string }
  | { type: 'LOG_OUT' };

const initialState: FitnessState = {
  isLoading: true,
  session: null,
  user: null,
  profile: null,
  exercises: [],
  plans: [],
  history: [],
};

const fitnessReducer = (state: FitnessState, action: FitnessAction): FitnessState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_SESSION_AND_PROFILE':
      return { ...state, session: action.payload.session, user: action.payload.session?.user ?? null, profile: action.payload.profile };
    case 'SET_USER_DATA':
      return { ...state, ...action.payload };
    case 'LOG_OUT':
        return {...initialState, isLoading: false };
    case 'UPDATE_PROFILE_LOCALLY':
      return { ...state, profile: action.payload };
    case 'ADD_EXERCISE':
      return { ...state, exercises: [...state.exercises, action.payload] };
    case 'DELETE_EXERCISE':
      return { ...state, exercises: state.exercises.filter(ex => ex.id !== action.payload) };
    case 'ADD_PLAN':
      return { ...state, plans: [...state.plans, action.payload] };
    case 'UPDATE_PLAN':
      return { ...state, plans: state.plans.map(p => p.id === action.payload.id ? action.payload : p) };
    case 'DELETE_PLAN':
      return { ...state, plans: state.plans.filter(p => p.id !== action.payload) };
    case 'ADD_WORKOUT_TO_HISTORY':
      return { ...state, history: [action.payload, ...state.history].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()) };
    case 'DELETE_WORKOUT_FROM_HISTORY':
      return { ...state, history: state.history.filter(h => h.id !== action.payload) };
    default:
      return state;
  }
};

const FitnessContext = createContext<{
  state: FitnessState;
  dispatch: React.Dispatch<FitnessAction>;
  updateProfile: (id: string, name: string, avatar: string) => Promise<void>;
  addExercise: (exercise: Omit<Exercise, 'id' | 'user_id'>) => Promise<void>;
  deleteExercise: (id: string) => Promise<void>;
  addPlan: (plan: Omit<WorkoutPlan, 'id' | 'user_id'>) => Promise<void>;
  updatePlan: (plan: WorkoutPlan) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  addWorkoutToHistory: (workout: Omit<WorkoutHistory, 'id' | 'user_id'>) => Promise<void>;
  deleteWorkoutFromHistory: (id: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
} | undefined>(undefined);

export const FitnessProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(fitnessReducer, initialState);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      let userProfile: Profile | null = null;
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        userProfile = profile;
      }
      dispatch({ type: 'SET_SESSION_AND_PROFILE', payload: { session, profile: userProfile } });
      dispatch({ type: 'SET_LOADING', payload: false });
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      let userProfile: Profile | null = null;
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        userProfile = profile;
      }
      if (!session) {
        dispatch({ type: 'LOG_OUT' });
      } else {
        dispatch({ type: 'SET_SESSION_AND_PROFILE', payload: { session, profile: userProfile } });
      }
      dispatch({ type: 'SET_LOADING', payload: false });
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!state.user) {
        dispatch({ type: 'SET_USER_DATA', payload: { exercises: [], plans: [], history: [] } });
        return;
      }
      
      const [exercisesRes, plansRes, historyRes] = await Promise.all([
          supabase.from('exercises').select('*').eq('user_id', state.user.id),
          supabase.from('plans').select('*').eq('user_id', state.user.id),
          supabase.from('history').select('*').eq('user_id', state.user.id)
      ]);

      if (exercisesRes.error || plansRes.error || historyRes.error) {
          console.error('Error fetching user data', exercisesRes.error, plansRes.error, historyRes.error);
          return;
      }

      dispatch({ type: 'SET_USER_DATA', payload: {
          exercises: exercisesRes.data || [],
          plans: plansRes.data || [],
          history: (historyRes.data || []).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      }});
    }
    fetchUserData();
  }, [state.user]);

  const updateProfile = async (id: string, name: string, avatar: string) => {
    dispatch({ type: 'UPDATE_PROFILE_LOCALLY', payload: { id, name, avatar }}); // Optimistic update
    const { error } = await supabase.from('profiles').update({ name, avatar }).eq('id', id);
    if (error) console.error("Error updating profile", error);
  };
  
  const addExercise = async (exercise: Omit<Exercise, 'id' | 'user_id'>) => {
    if (!state.user) return;
    const { data, error } = await supabase.from('exercises').insert({ ...exercise, user_id: state.user.id }).select().single();
    if (error) console.error("Error adding exercise", error);
    else if (data) dispatch({ type: 'ADD_EXERCISE', payload: data });
  };
  
  const deleteExercise = async (id: string) => {
    dispatch({ type: 'DELETE_EXERCISE', payload: id });
    const { error } = await supabase.from('exercises').delete().eq('id', id);
    if (error) console.error("Error deleting exercise", error);
  };

  const addPlan = async (plan: Omit<WorkoutPlan, 'id' | 'user_id'>) => {
    if (!state.user) return;
    const { data, error } = await supabase.from('plans').insert({ ...plan, user_id: state.user.id }).select().single();
    if (error) console.error("Error adding plan", error);
    else if (data) dispatch({ type: 'ADD_PLAN', payload: data });
  };
  
  const updatePlan = async (plan: WorkoutPlan) => {
    dispatch({ type: 'UPDATE_PLAN', payload: plan });
    const { id, user_id, ...planData } = plan;
    const { error } = await supabase.from('plans').update(planData).eq('id', id);
    if (error) console.error("Error updating plan", error);
  };

  const deletePlan = async (id: string) => {
    dispatch({ type: 'DELETE_PLAN', payload: id });
    const { error } = await supabase.from('plans').delete().eq('id', id);
    if (error) console.error("Error deleting plan", error);
  };

  const addWorkoutToHistory = async (workout: Omit<WorkoutHistory, 'id' | 'user_id'>) => {
    if (!state.user) return;
    const { data, error } = await supabase.from('history').insert({ ...workout, user_id: state.user.id }).select().single();
    if (error) console.error("Error adding workout", error);
    else if (data) dispatch({ type: 'ADD_WORKOUT_TO_HISTORY', payload: data });
  };
  
  const deleteWorkoutFromHistory = async (id: string) => {
    dispatch({ type: 'DELETE_WORKOUT_FROM_HISTORY', payload: id });
    const { error } = await supabase.from('history').delete().eq('id', id);
    if (error) console.error("Error deleting workout", error);
  };
  
  const deleteAccount = async () => {
    if (!state.user) return;
    
    // In a real app, this should be a single RPC call to a secured database function.
    // This client-side chain is for demonstration purposes.
    console.log("Deleting all data for user:", state.user.id);
    await supabase.from('history').delete().eq('user_id', state.user.id);
    await supabase.from('plans').delete().eq('user_id', state.user.id);
    await supabase.from('exercises').delete().eq('user_id', state.user.id);
    await supabase.from('profiles').delete().eq('id', state.user.id);

    // IMPORTANT: Deleting the auth user must be done server-side (e.g., an Edge Function)
    // with admin privileges. We will just sign out on the client.
    const { error } = await supabase.auth.signOut();
    if(error) console.error("Error signing out after data deletion", error);
  };

  return (
    <FitnessContext.Provider value={{ state, dispatch, updateProfile, addExercise, deleteExercise, addPlan, updatePlan, deletePlan, addWorkoutToHistory, deleteWorkoutFromHistory, deleteAccount }}>
      {children}
    </FitnessContext.Provider>
  );
};

export const useFitness = () => {
  const context = useContext(FitnessContext);
  if (context === undefined) {
    throw new Error('useFitness must be used within a FitnessProvider');
  }
  return context;
};
