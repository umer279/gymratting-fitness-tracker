import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Exercise, WorkoutPlan, WorkoutHistory, Profile } from '../types';
import { supabase } from '../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import { AVATARS } from '../constants';

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
  addExercise: (exercise: Omit<Exercise, 'id' | 'user_id'>) => Promise<Exercise | null>;
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
    // --- START: Local Development Mock ---
    const env = (import.meta as any).env;
    if (env.MODE === 'development' && env.VITE_MOCK_USER_ENABLED === 'true') {
      console.log("DEV MODE: Bypassing login with mock user.");
      const mockUser: User = {
        id: '8a584173-d52d-487e-a1c9-efe13833d135',
        email: 'local-dev@gymrat.com',
        app_metadata: { provider: 'email' }, user_metadata: {}, aud: 'authenticated', created_at: new Date().toISOString(),
      };
      const mockSession: Session = {
        access_token: 'mock-access-token', refresh_token: 'mock-refresh-token', user: mockUser, token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600,
      };
      const mockProfile: Profile = { id: mockUser.id, name: 'Local Dev', avatar: '🏆' };
      dispatch({ type: 'SET_SESSION_AND_PROFILE', payload: { session: mockSession, profile: mockProfile } });
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }
    // --- END: Local Development Mock ---

    // --- START: Production Authentication Logic ---
    dispatch({ type: 'SET_LOADING', payload: true });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        dispatch({ type: 'LOG_OUT' });
        return;
      }

      const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which we handle.
        console.error("Error fetching profile, logging out:", error);
        supabase.auth.signOut();
      } else if (profile) {
        dispatch({ type: 'SET_SESSION_AND_PROFILE', payload: { session, profile } });
        dispatch({ type: 'SET_LOADING', payload: false });
      } else {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            name: session.user.email?.split('@')[0] || 'Gymrat',
            avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)]
          })
          .select()
          .single();
        
        if (insertError) {
          console.error("Error creating profile, logging out:", insertError);
          supabase.auth.signOut();
        } else {
          dispatch({ type: 'SET_SESSION_AND_PROFILE', payload: { session, profile: newProfile } });
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
    // --- END: Production Authentication Logic ---
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

    const env = (import.meta as any).env;
    if (env.MODE === 'development' && env.VITE_MOCK_USER_ENABLED === 'true') {
        // In mock mode, don't fetch data from supabase, just use local state
        return;
    }
    fetchUserData();
  }, [state.user]);

  const isMockMode = () => {
    const env = (import.meta as any).env;
    return env.MODE === 'development' && env.VITE_MOCK_USER_ENABLED === 'true';
  }

  const updateProfile = async (id: string, name: string, avatar: string) => {
    dispatch({ type: 'UPDATE_PROFILE_LOCALLY', payload: { id, name, avatar }});
    if (isMockMode()) {
        console.log("DEV MODE: Updating profile locally.");
        return;
    }
    const { error } = await supabase.from('profiles').update({ name, avatar }).eq('id', id);
    if (error) console.error("Error updating profile", error);
  };
  
  const addExercise = async (exercise: Omit<Exercise, 'id' | 'user_id'>): Promise<Exercise | null> => {
    if (!state.user) return null;
    if (isMockMode()) {
        console.log("DEV MODE: Adding exercise locally.");
        const newExercise: Exercise = { ...exercise, id: crypto.randomUUID(), user_id: state.user.id };
        dispatch({ type: 'ADD_EXERCISE', payload: newExercise });
        return newExercise;
    }
    const { data, error } = await supabase.from('exercises').insert({ ...exercise, user_id: state.user.id }).select().single();
    if (error) {
        console.error("Error adding exercise", error);
        return null;
    }
    if (data) {
        dispatch({ type: 'ADD_EXERCISE', payload: data });
        return data;
    }
    return null;
  };
  
  const deleteExercise = async (id: string) => {
    dispatch({ type: 'DELETE_EXERCISE', payload: id });
    if (isMockMode()) {
        console.log("DEV MODE: Deleting exercise locally.");
        return;
    }
    const { error } = await supabase.from('exercises').delete().eq('id', id);
    if (error) console.error("Error deleting exercise", error);
  };

  const addPlan = async (plan: Omit<WorkoutPlan, 'id' | 'user_id'>) => {
    if (!state.user) return;
    if (isMockMode()) {
        console.log("DEV MODE: Adding plan locally.");
        const newPlan: WorkoutPlan = { ...plan, id: crypto.randomUUID(), user_id: state.user.id };
        dispatch({ type: 'ADD_PLAN', payload: newPlan });
        return;
    }
    const { data, error } = await supabase.from('plans').insert({ ...plan, user_id: state.user.id }).select().single();
    if (error) console.error("Error adding plan", error);
    else if (data) dispatch({ type: 'ADD_PLAN', payload: data });
  };
  
  const updatePlan = async (plan: WorkoutPlan) => {
    dispatch({ type: 'UPDATE_PLAN', payload: plan });
    if (isMockMode()) {
        console.log("DEV MODE: Updating plan locally.");
        return;
    }
    const { id, user_id, ...planData } = plan;
    const { error } = await supabase.from('plans').update(planData).eq('id', id);
    if (error) console.error("Error updating plan", error);
  };

  const deletePlan = async (id: string) => {
    dispatch({ type: 'DELETE_PLAN', payload: id });
    if (isMockMode()) {
        console.log("DEV MODE: Deleting plan locally.");
        return;
    }
    const { error } = await supabase.from('plans').delete().eq('id', id);
    if (error) console.error("Error deleting plan", error);
  };

  const addWorkoutToHistory = async (workout: Omit<WorkoutHistory, 'id' | 'user_id'>) => {
    if (!state.user) return;
    if (isMockMode()) {
        console.log("DEV MODE: Adding workout to history locally.");
        const newHistory: WorkoutHistory = { ...workout, id: crypto.randomUUID(), user_id: state.user.id };
        dispatch({ type: 'ADD_WORKOUT_TO_HISTORY', payload: newHistory });
        return;
    }
    const { data, error } = await supabase.from('history').insert({ ...workout, user_id: state.user.id }).select().single();
    if (error) console.error("Error adding workout", error);
    else if (data) dispatch({ type: 'ADD_WORKOUT_TO_HISTORY', payload: data });
  };
  
  const deleteWorkoutFromHistory = async (id: string) => {
    dispatch({ type: 'DELETE_WORKOUT_FROM_HISTORY', payload: id });
    if (isMockMode()) {
        console.log("DEV MODE: Deleting workout from history locally.");
        return;
    }
    const { error } = await supabase.from('history').delete().eq('id', id);
    if (error) console.error("Error deleting workout", error);
  };
  
  const deleteAccount = async () => {
    if (!state.user) return;
    if (isMockMode()) {
        console.log("DEV MODE: Deleting account locally (logging out).");
        dispatch({ type: 'LOG_OUT' });
        return;
    }
    console.log("Deleting all data for user:", state.user.id);
    await supabase.from('history').delete().eq('user_id', state.user.id);
    await supabase.from('plans').delete().eq('user_id', state.user.id);
    await supabase.from('exercises').delete().eq('user_id', state.user.id);
    await supabase.from('profiles').delete().eq('id', state.user.id);

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