
import React, { useState } from 'react';
import { useFitness } from '../context/FitnessContext';
import { WorkoutHistory, ExerciseType } from '../types';
import { Calendar, Clock, X, Trash2 } from 'lucide-react';

const HistoryDetailModal: React.FC<{ workout: WorkoutHistory, onClose: () => void }> = ({ workout, onClose }) => {
    const { state, deleteWorkoutFromHistory } = useFitness();
    const getExercise = (id: string) => state.exercises.find(e => e.id === id);
    const formatDuration = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
    }
    
    const handleDelete = () => {
        if(window.confirm("Are you sure you want to delete this workout history?")) {
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
                    <span className="flex items-center"><Clock className="w-4 h-4 mr-1"/> {Math.floor(workout.duration / 60)} min</span>
                </div>
                <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-4">
                    {workout.exercises.map((ex, index) => {
                        const exercise = getExercise(ex.exerciseId);
                        return (
                        <div key={index} className="bg-slate-900 p-4 rounded-lg">
                            <h3 className="font-semibold text-lg text-electric-blue-400">{exercise?.name || 'Unknown Exercise'}</h3>
                            {ex.notes && <p className="text-xs italic text-slate-400 mb-2">{ex.notes}</p>}

                            {exercise?.exerciseType === ExerciseType.STRENGTH && ex.sets && (
                                <table className="w-full text-sm text-left mt-2">
                                    <thead className="text-slate-400"><tr><th className="p-2">Set</th><th className="p-2">Weight (kg)</th><th className="p-2">Reps</th></tr></thead>
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
                                    <div className="flex justify-between p-2 bg-slate-700/50 rounded"><span>Duration:</span> <span className="font-mono">{formatDuration(ex.cardioPerformance.duration)}</span></div>
                                    {ex.cardioPerformance.distance && <div className="flex justify-between p-2 bg-slate-700/50 rounded"><span>Distance:</span> <span className="font-mono">{ex.cardioPerformance.distance} km</span></div>}
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
  const { state } = useFitness();
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutHistory | null>(null);

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-6">Workout History</h1>
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
                            <span className="flex items-center"><Clock className="w-4 h-4 mr-1"/> {Math.floor(workout.duration / 60)} min</span>
                        </div>
                    </div>
                    <div className="mt-3 sm:mt-0 text-right">
                        <p className="text-sm font-semibold text-slate-300">{workout.exercises.length} Exercises</p>
                    </div>
                </div>
                <div className="text-xs text-slate-400 mt-2">Click to view details</div>
            </button>
          </div>
        )) : (
            <div className="text-center py-10 px-6 bg-slate-800 rounded-lg border-2 border-dashed border-slate-700">
                <p className="text-slate-400">Your workout history is empty. Complete a workout to see it here!</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default HistoryScreen;
