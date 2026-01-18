



import React, { useState } from 'react';
import { useFitness } from '../context/FitnessContext';
import { WorkoutHistory, ExerciseType } from '../types';
import { Calendar, Clock, X, Trash2, RefreshCw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const HistoryDetailModal: React.FC<{ workout: WorkoutHistory, onClose: () => void }> = ({ workout, onClose }) => {
    const { state, deleteWorkoutFromHistory } = useFitness();
    const { t } = useLanguage();
    const getExercise = (id: string) => state.exercises.find(e => e.id === id);
    const formatDuration = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
    }
    
    const handleDelete = () => {
        if(window.confirm(t('delete_history_confirm'))) {
            deleteWorkoutFromHistory(workout.id);
            onClose();
        }
    }

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">{workout.planName}</h2>
                    <div className="flex items-center space-x-2">
                        <button onClick={handleDelete} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={18} /></button>
                        <button onClick={onClose} className="text-slate-400 hover:text-white p-1"><X /></button>
                    </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-slate-400 mb-4">
                    <span className="flex items-center"><Calendar className="w-4 h-4 mr-1"/> {new Date(workout.date).toLocaleDateString()}</span>
                    <span className="flex items-center"><Clock className="w-4 h-4 mr-1"/> {t('history_detail_duration', { minutes: Math.floor(workout.duration / 60) })}</span>
                </div>
                <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-4">
                    {workout.exercises.map((ex, index) => {
                        const exercise = getExercise(ex.exerciseId);
                        return (
                        <div key={index} className="bg-slate-900 p-4 rounded-lg">
                            <h3 className="font-semibold text-lg text-electric-blue-400">{exercise?.name || t('unknown_exercise')}</h3>
                            {ex.notes && <p className="text-xs italic text-slate-400 mb-2">{ex.notes}</p>}

                            {exercise?.exerciseType === ExerciseType.STRENGTH && ex.sets && (
                                <table className="w-full text-sm text-left mt-2">
                                    <thead className="text-slate-400"><tr><th className="p-2">{t('table_header_set')}</th><th className="p-2">{t('table_header_weight')}</th><th className="p-2">{t('table_header_reps')}</th></tr></thead>
                                    <tbody className="text-slate-200">
                                        {ex.sets.map((set, setIndex) => (
                                            <tr key={setIndex} className="border-t border-slate-700">
                                                <td className="p-2 font-bold">{setIndex + 1}</td><td className="p-2">{set.weight}</td><td className="p-2">{set.reps}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {exercise?.exerciseType === ExerciseType.CARDIO && ex.cardioPerformance && (
                                <div className="mt-2 space-y-1 text-sm">
                                    <div className="flex justify-between p-2 bg-slate-700/50 rounded"><span>{t('cardio_duration')}</span> <span className="font-mono">{formatDuration(ex.cardioPerformance.duration)}</span></div>
                                    {ex.cardioPerformance.distance && <div className="flex justify-between p-2 bg-slate-700/50 rounded"><span>{t('cardio_distance')}</span> <span className="font-mono">{ex.cardioPerformance.distance} km</span></div>}
                                </div>
                            )}
                        </div>
                    )})}
                </div>
            </div>
        </div>
    )
}

const HistoryScreen: React.FC = () => {
  const { state, refetchUserData } = useFitness();
  const { t } = useLanguage();
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutHistory | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
      setIsRefreshing(true);
      try {
          await refetchUserData();
      } catch (error) {
          console.error("Failed to refresh history:", error);
      } finally {
          setIsRefreshing(false);
      }
  }

  return (
    <div className="p-4 md:p-8 pb-32 md:pb-24">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold">{t('history_title')}</h1>
            <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center justify-center py-2 px-4 bg-slate-700 text-white font-bold rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <RefreshCw className={`w-5 h-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? t('refreshing_button') : t('refresh_button')}
            </button>
        </div>
      {selectedWorkout && <HistoryDetailModal workout={selectedWorkout} onClose={() => setSelectedWorkout(null)} />}
      <div className="space-y-4">
        {state.history.length > 0 ? state.history.map((workout) => (
          <div key={workout.id} className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
            <button onClick={() => setSelectedWorkout(workout)} className="w-full text-left p-5 hover:bg-slate-700/50 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                    <div>
                        <h2 className="text-xl font-bold text-electric-blue-400">{workout.planName}</h2>
                        <div className="flex items-center space-x-4 text-sm text-slate-400 mt-1">
                            <span className="flex items-center"><Calendar className="w-4 h-4 mr-1"/> {new Date(workout.date).toLocaleDateString()}</span>
                            <span className="flex items-center"><Clock className="w-4 h-4 mr-1"/> {t('history_detail_duration', { minutes: Math.floor(workout.duration / 60) })}</span>
                        </div>
                    </div>
                    <div className="mt-3 sm:mt-0 text-right">
                        <p className="text-sm font-semibold text-slate-300">{t('history_detail_exercises', { count: workout.exercises.length })}</p>
                    </div>
                </div>
                <div className="text-xs text-slate-400 mt-2">{t('history_detail_view_details')}</div>
            </button>
          </div>
        )) : (
            <div className="text-center py-10 px-6 bg-slate-800 rounded-lg border-2 border-dashed border-slate-700">
                <p className="text-slate-400">{t('no_history_yet')}</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default HistoryScreen;