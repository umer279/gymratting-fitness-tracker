


import React, { useState } from 'react';
import { useFitness } from '../context/FitnessContext';
import { WorkoutPlan, ExerciseType, PerformedExercise } from '../types';
import { PlusCircle, Play, Dumbbell, History, Settings, TrendingUp } from 'lucide-react';
import SettingsModal from './SettingsModal';
import { useLanguage } from '../context/LanguageContext';

interface DashboardProps {
  setActiveScreen: (screen: 'PLANS' | 'HISTORY' | 'EXERCISES' | 'ANALYTICS') => void;
  onStartWorkout: (plan: WorkoutPlan) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setActiveScreen, onStartWorkout }) => {
  const { state } = useFitness();
  const { t } = useLanguage();
  const [showSettings, setShowSettings] = useState(false);
  const latestHistory = state.history[0];
  const recentPlan = state.plans.find(p => p.id === latestHistory?.planId) ?? state.plans[0];
  const activeProfile = state.profile;

  const getExerciseName = (id: string) => state.exercises.find(e => e.id === id)?.name || t('unknown_exercise');

  const getExerciseSummary = (ex: PerformedExercise) => {
    const exercise = state.exercises.find(e => e.id === ex.exerciseId);
    if (exercise?.exerciseType === ExerciseType.STRENGTH) {
      return `${ex.sets?.length || 0} sets`;
    }
    if (exercise?.exerciseType === ExerciseType.CARDIO) {
      const duration = ex.cardioPerformance?.duration || 0;
      return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    }
    return '';
  }

  return (
    <div className="p-4 md:p-8 relative pb-32 md:pb-24">
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold">{t('dashboard_title')}</h1>
                {activeProfile && <p className="text-slate-400">{t('dashboard_welcome', { name: activeProfile.name, avatar: activeProfile.avatar })}</p>}
            </div>
            <button onClick={() => setShowSettings(true)} className="flex items-center text-sm py-2 px-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                <Settings className="w-4 h-4 mr-2" />
                {t('settings_button')}
            </button>
        </div>

      {/* Quick Start Card */}
      {recentPlan && (
        <div className="bg-slate-800 rounded-xl p-6 mb-8 shadow-lg border border-slate-700">
          <h2 className="text-xl font-semibold text-electric-blue-400 mb-2">{t('quick_start_title')}</h2>
          <p className="text-slate-400 mb-4">{t('quick_start_subtitle')}</p>
          <div className="bg-slate-900 p-4 rounded-lg">
            <h3 className="text-lg font-bold">{recentPlan.name}</h3>
            <p className="text-sm text-slate-400 truncate">
              {recentPlan.exercises.map(e => getExerciseName(e.exerciseId)).join(', ')}
            </p>
          </div>
          <button
            onClick={() => onStartWorkout(recentPlan)}
            className="mt-4 w-full flex items-center justify-center py-3 px-4 bg-electric-blue-600 text-white font-bold rounded-lg hover:bg-electric-blue-500 transition-all duration-200 transform hover:scale-105"
          >
            <Play className="w-5 h-5 mr-2" />
            {t('start_workout_button', { planName: recentPlan.name })}
          </button>
        </div>
      )}

      {/* Last Workout Summary */}
      <div className="bg-slate-800 rounded-xl p-6 mb-8 shadow-lg border border-slate-700">
        <h2 className="text-xl font-semibold mb-4 text-electric-blue-400">{t('last_workout_title')}</h2>
        {latestHistory ? (
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <h3 className="text-lg font-bold">{latestHistory.planName}</h3>
              <p className="text-sm text-slate-400">{new Date(latestHistory.date).toLocaleDateString()}</p>
            </div>
            <ul className="space-y-2 text-sm">
              {latestHistory.exercises.slice(0, 3).map(ex => (
                <li key={ex.exerciseId} className="flex justify-between p-2 rounded bg-slate-700/50">
                  <span>{getExerciseName(ex.exerciseId)}</span>
                  <span className="font-mono text-slate-300">{getExerciseSummary(ex)}</span>
                </li>
              ))}
            </ul>
             <button
                onClick={() => setActiveScreen('HISTORY')}
                className="mt-4 text-sm text-electric-blue-400 hover:text-electric-blue-300 font-semibold"
              >
                {t('view_full_history')}
            </button>
          </div>
        ) : (
          <p className="text-slate-400">{t('no_workout_history_yet')}</p>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-electric-blue-400">{t('quick_actions_title')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button onClick={() => setActiveScreen('PLANS')} className="p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors text-center">
                <PlusCircle className="w-8 h-8 mx-auto mb-2 text-electric-blue-500"/>
                <span className="font-semibold">{t('action_create_plan')}</span>
            </button>
             <button onClick={() => setActiveScreen('EXERCISES')} className="p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors text-center">
                <Dumbbell className="w-8 h-8 mx-auto mb-2 text-electric-blue-500"/>
                <span className="font-semibold">{t('action_manage_exercises')}</span>
            </button>
            <button onClick={() => setActiveScreen('HISTORY')} className="p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors text-center">
                <History className="w-8 h-8 mx-auto mb-2 text-electric-blue-500"/>
                <span className="font-semibold">{t('action_view_history')}</span>
            </button>
            <button onClick={() => setActiveScreen('ANALYTICS')} className="p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-electric-blue-500"/>
                <span className="font-semibold">{t('action_view_analytics')}</span>
            </button>
        </div>
      </div>
      
    </div>
  );
};

export default Dashboard;