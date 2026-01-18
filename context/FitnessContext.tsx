

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { Exercise, WorkoutPlan, WorkoutHistory, Profile } from '../types';
import { supabase } from '../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import { AVATARS } from '../constants';
import { GoogleGenAI } from '@google/genai';

// Combined state
interface FitnessState {
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  exercises: Exercise[];
  plans: WorkoutPlan[];
  history: WorkoutHistory[];
  deferredPrompt: any | null;
  showIosInstallInstructions: boolean;
  showAndroidInstallInstructions: boolean;
}

type FitnessAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SESSION_AND_PROFILE'; payload: { session: Session | null; profile: Profile | null } }
  | { type: 'SET_USER_DATA'; payload: { exercises: Exercise[]; plans: WorkoutPlan[]; history: WorkoutHistory[] } }
  | { type: 'UPDATE_PROFILE_LOCALLY'; payload: Profile }
  | { type: 'ADD_EXERCISE'; payload: Exercise }
  | { type: 'UPDATE_EXERCISE'; payload: Exercise }
  | { type: 'DELETE_EXERCISE'; payload: string }
  | { type: 'ADD_PLAN'; payload: WorkoutPlan }
  | { type: 'UPDATE_PLAN'; payload: WorkoutPlan }
  | { type: 'DELETE_PLAN'; payload: string }
  | { type: 'ADD_WORKOUT_TO_HISTORY'; payload: WorkoutHistory }
  | { type: 'DELETE_WORKOUT_FROM_HISTORY'; payload: string }
  | { type: 'LOG_OUT' }
  | { type: 'SET_DEFERRED_PROMPT'; payload: any | null }
  | { type: 'SET_IOS_INSTALL_INSTRUCTIONS'; payload: boolean }
  | { type: 'SET_ANDROID_INSTALL_INSTRUCTIONS'; payload: boolean };

const initialState: FitnessState = {
  isLoading: true,
  session: null,
  user: null,
  profile: null,
  exercises: [],
  plans: [],
  history: [],
  deferredPrompt: null,
  showIosInstallInstructions: false,
  showAndroidInstallInstructions: false,
};

const fitnessReducer = (state: FitnessState, action: FitnessAction): FitnessState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_SESSION_AND_PROFILE':
      return { ...state, isLoading: false, session: action.payload.session, user: action.payload.session?.user ?? null, profile: action.payload.profile };
    case 'SET_USER_DATA':
      return { ...state, ...action.payload };
    case 'LOG_OUT':
        return {...initialState, isLoading: false };
    case 'UPDATE_PROFILE_LOCALLY':
      return { ...state, profile: action.payload };
    case 'ADD_EXERCISE':
      return { ...state, exercises: [...state.exercises, action.payload] };
    case 'UPDATE_EXERCISE':
      return { ...state, exercises: state.exercises.map(ex => ex.id === action.payload.id ? action.payload : ex) };
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
    case 'SET_DEFERRED_PROMPT':
      if (action.payload) {
        return { ...state, deferredPrompt: action.payload, showAndroidInstallInstructions: false };
      }
      return { ...state, deferredPrompt: null };
    case 'SET_IOS_INSTALL_INSTRUCTIONS':
        return { ...state, showIosInstallInstructions: action.payload };
    case 'SET_ANDROID_INSTALL_INSTRUCTIONS':
        if (state.deferredPrompt) {
            return state;
        }
        return { ...state, showAndroidInstallInstructions: action.payload };
    default:
      return state;
  }
};

const FitnessContext = createContext<{
  state: FitnessState;
  dispatch: React.Dispatch<FitnessAction>;
  updateProfile: (id: string, name: string, avatar: string) => Promise<void>;
  addExercise: (exercise: Omit<Exercise, 'id' | 'user_id'>) => Promise<Exercise | null>;
  updateExercise: (exercise: Exercise) => Promise<void>;
  deleteExercise: (id: string) => Promise<void>;
  addPlan: (plan: Omit<WorkoutPlan, 'id' | 'user_id'>) => Promise<void>;
  updatePlan: (plan: WorkoutPlan) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  addWorkoutToHistory: (workout: Omit<WorkoutHistory, 'id' | 'user_id'>) => Promise<void>;
  deleteWorkoutFromHistory: (id: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  refetchUserData: () => Promise<void>;
  triggerInstallPrompt: () => Promise<void>;
  getAiFitnessCoachResponse: (prompt: string) => Promise<string>;
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
      return;
    }
    // --- END: Local Development Mock ---

    const checkSession = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                dispatch({ type: 'LOG_OUT' });
                return;
            }

            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
                throw error;
            }

            if (profile) {
                dispatch({ type: 'SET_SESSION_AND_PROFILE', payload: { session, profile } });
            } else {
                // No profile found, let's create one.
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
                    throw insertError;
                }
                dispatch({ type: 'SET_SESSION_AND_PROFILE', payload: { session, profile: newProfile } });
            }
        } catch (error) {
            console.error("Session check failed, signing out.", error);
            await supabase.auth.signOut();
            // The onAuthStateChange listener below will then trigger a LOG_OUT dispatch.
        }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
            dispatch({ type: 'LOG_OUT' });
        } else if (event === 'SIGNED_IN') {
            // When a user signs in (e.g., from the auth form), re-run the check to fetch their profile.
            checkSession();
        }
    });

    return () => {
        subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      dispatch({ type: 'SET_DEFERRED_PROMPT', payload: e });
    };

    const handleAppInstalled = () => {
      dispatch({ type: 'SET_DEFERRED_PROMPT', payload: null });
      dispatch({ type: 'SET_ANDROID_INSTALL_INSTRUCTIONS', payload: false });
      dispatch({ type: 'SET_IOS_INSTALL_INSTRUCTIONS', payload: false });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    const ua = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isAndroid = /android/i.test(ua);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (isStandalone) {
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }

    if (isIOS) {
      dispatch({ type: 'SET_IOS_INSTALL_INSTRUCTIONS', payload: true });
    } else if (isAndroid) {
      dispatch({ type: 'SET_ANDROID_INSTALL_INSTRUCTIONS', payload: true });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);


  const fetchUserData = useCallback(async () => {
      if (!state.user) {
        dispatch({ type: 'SET_USER_DATA', payload: { exercises: [], plans: [], history: [] } });
        return;
      }
      
      const [exercisesRes, plansRes, historyRes] = await Promise.all([
          supabase.from('exercises').select('*').eq('user_id', state.user.id),
          supabase.from('plans').select('*').eq('user_id', state.user.id),
          supabase.from('history').select('*').eq('user_id', state.user.id)
      ]);

      const results = [exercisesRes, plansRes, historyRes];
      for (const res of results) {
          if (res.error && (res.status === 401 || res.error.message.includes('JWT'))) {
              console.error('Invalid session detected during data fetch. Signing out.');
              await supabase.auth.signOut();
              return;
          }
      }

      if (exercisesRes.error || plansRes.error || historyRes.error) {
          console.error('Error fetching user data', exercisesRes.error, plansRes.error, historyRes.error);
          return;
      }

      dispatch({ type: 'SET_USER_DATA', payload: {
          exercises: exercisesRes.data || [],
          plans: plansRes.data || [],
          history: (historyRes.data || []).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      }});
    }, [state.user]);

  useEffect(() => {
    const env = (import.meta as any).env;
    if (env.MODE === 'development' && env.VITE_MOCK_USER_ENABLED === 'true') {
        // In mock mode, don't fetch data from supabase, just use local state
        return;
    }
    fetchUserData();
  }, [state.user, fetchUserData]);
  
  const triggerInstallPrompt = async () => {
    if (state.deferredPrompt) {
      state.deferredPrompt.prompt();
      // The prompt can only be used once.
      dispatch({ type: 'SET_DEFERRED_PROMPT', payload: null });
    }
  };

  const isMockMode = () => {
    const env = (import.meta as any).env;
    return env.MODE === 'development' && env.VITE_MOCK_USER_ENABLED === 'true';
  }

  const getAiFitnessCoachResponse = async (prompt: string): Promise<string> => {
    const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        return "AI features are not configured. Please set the VITE_GEMINI_API_KEY in your environment.";
    }
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are an expert fitness coach and nutritionist named Gymrat AI. You are helping a user with their fitness journey. Your tone should be encouraging and informative. Use the provided user data to give personalized advice. Keep your answers concise and well-formatted using markdown (e.g., lists, bold text).`;
    
    // Sanitize and structure user data for the prompt
    const userDataContext = JSON.stringify({
      plans: state.plans.map(p => ({ name: p.name, exercises: p.exercises.length })),
      recentHistory: state.history.slice(0, 5).map(h => ({ planName: h.planName, date: h.date, exercises: h.exercises.length })),
      availableExercises: state.exercises.map(e => e.name)
    });
    
    const fullPrompt = `User Data Context: ${userDataContext}\n\nUser Question: "${prompt}"`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: fullPrompt,
            config: {
                systemInstruction: systemInstruction,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return "Sorry, I'm having trouble connecting to my brain right now. Please try again later.";
    }
  };

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

  const updateExercise = async (exercise: Exercise) => {
    dispatch({ type: 'UPDATE_EXERCISE', payload: exercise });
    if (isMockMode()) {
        console.log("DEV MODE: Updating exercise locally.");
        return;
    }
    const { id, user_id, ...updateData } = exercise;
    const { error } = await supabase.from('exercises').update(updateData).eq('id', id);
    if (error) console.error("Error updating exercise", error);
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
    <FitnessContext.Provider value={{ state, dispatch, updateProfile, addExercise, updateExercise, deleteExercise, addPlan, updatePlan, deletePlan, addWorkoutToHistory, deleteWorkoutFromHistory, deleteAccount, refetchUserData: fetchUserData, triggerInstallPrompt, getAiFitnessCoachResponse }}>
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
