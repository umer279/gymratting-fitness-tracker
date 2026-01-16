import React, { useState, useEffect, useMemo } from 'react';
import { WorkoutPlan, PerformedSet, PerformedExercise, WorkoutHistory, PlanExercise, ExerciseType } from '../types';
import { useFitness } from '../context/FitnessContext';
import { ChevronLeft, ChevronRight, Check, History, Info } from 'lucide-react';

interface WorkoutSessionProps {
  plan: WorkoutPlan;
  onFinish: () => void;
}

type StrengthSessionSet = { weight: string; reps: string };
type CardioSessionData = { minutes: string; seconds: string; distance: string; };

const WorkoutSession: React.FC<WorkoutSessionProps> = ({ plan, onFinish }) => {
  const { state, addWorkoutToHistory } = useFitness();
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [strengthSessionData, setStrengthSessionData] = useState<Record<string, StrengthSessionSet[]>>({});
  const [cardioSessionData, setCardioSessionData] = useState<Record<string, CardioSessionData>>({});
  const [startTime] = useState(Date.now());
  
  const currentPlanExercise = plan.exercises[currentExerciseIndex];
  const currentExercise = useMemo(() => 
    state.exercises.find(ex => ex.id === currentPlanExercise.exerciseId),
    [state.exercises, currentPlanExercise]
  );

  useEffect(() => {
    const initialStrengthData: Record<string, StrengthSessionSet[]> = {};
    const initialCardioData: Record<string, CardioSessionData> = {};
    plan.exercises.forEach(pe => {
      const exercise = state.exercises.find(ex => ex.id === pe.exerciseId);
      if (exercise?.exerciseType === ExerciseType.STRENGTH) {
        initialStrengthData[pe.exerciseId] = Array(pe.numberOfSets || 0).fill({ weight: '', reps: '' });
      } else if (exercise?.exerciseType === ExerciseType.CARDIO) {
        initialCardioData[pe.exerciseId] = { minutes: '', seconds: '', distance: '' };
      }
    });
    setStrengthSessionData(initialStrengthData);
    setCardioSessionData(initialCardioData);
  }, [plan, state.exercises]);

  const getPreviousPerformance = (exerciseId: string): PerformedExercise | null => {
    for (const workout of state.history) {
      const performed = workout.exercises.find(e => e.exerciseId === exerciseId);
      if (performed && (performed.sets || performed.cardioPerformance)) {
        return performed;
      }
    }
    return null;
  };
  
  const previousPerformance = useMemo(() => 
    currentExercise ? getPreviousPerformance(currentExercise.id) : null,
    [currentExercise, state.history]
  );
  
  const handleStrengthChange = (exerciseId: string, setIndex: number, field: 'weight' | 'reps', value: string) => {
    const updatedSets = [...strengthSessionData[exerciseId]];
    updatedSets[setIndex] = { ...updatedSets[setIndex], [field]: value };
    setStrengthSessionData({ ...strengthSessionData, [exerciseId]: updatedSets });
  };
  
  const handleCardioChange = (exerciseId: string, field: keyof CardioSessionData, value: string) => {
    setCardioSessionData({ ...cardioSessionData, [exerciseId]: { ...cardioSessionData[exerciseId], [field]: value }});
  }

  const handleFinishWorkout = () => {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const performedExercises: PerformedExercise[] = plan.exercises.map(planEx => {
        const exercise = state.exercises.find(ex => ex.id === planEx.exerciseId);
        if (exercise?.exerciseType === ExerciseType.STRENGTH) {
            const setsData = strengthSessionData[planEx.exerciseId] || [];
            const performedSets: PerformedSet[] = setsData
              .map(s => ({ weight: parseFloat(s.weight) || 0, reps: parseInt(s.reps, 10) || 0 }))
              .filter(s => s.reps > 0);
            return performedSets.length > 0 ? { exerciseId: planEx.exerciseId, sets: performedSets, notes: planEx.notes } : null;
        }
        if (exercise?.exerciseType === ExerciseType.CARDIO) {
            const cardioData = cardioSessionData[planEx.exerciseId];
            const totalSeconds = (parseInt(cardioData.minutes, 10) || 0) * 60 + (parseInt(cardioData.seconds, 10) || 0);
            if (totalSeconds > 0) {
              return {
                exerciseId: planEx.exerciseId,
                cardioPerformance: {
                  duration: totalSeconds,
                  distance: parseFloat(cardioData.distance) || undefined,
                },
                notes: planEx.notes
              };
            }
        }
        return null;
      // FIX: The type predicate `(ex): ex is PerformedExercise` was incorrect because `PerformedExercise` is a supertype of the non-null elements in the array, not a subtype.
      // Using `filter(Boolean)` correctly removes null values and allows TypeScript to infer the correct type.
      }).filter(Boolean);
      
    if (performedExercises.length > 0) {
      const newHistoryItem = {
        planId: plan.id,
        planName: plan.name,
        date: new Date().toISOString(),
        duration,
        exercises: performedExercises,
      };
      addWorkoutToHistory(newHistoryItem);
    }
    onFinish();
  };
  
  const formatDuration = (totalSeconds: number) => {
    if (!totalSeconds) return '0m 0s';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  }

  if (!currentExercise) return <div className="p-4 text-center">Loading exercise...</div>;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto h-screen flex flex-col">
      <div className="flex-shrink-0">
        <h1 className="text-3xl md:text-4xl font-bold text-electric-blue-400">{plan.name}</h1>
        <p className="text-slate-400 mb-4">Exercise {currentExerciseIndex + 1} of {plan.exercises.length}</p>
        <h2 className="text-2xl md:text-3xl font-semibold mb-2">{currentExercise.name}</h2>
        {currentExercise.exerciseType === ExerciseType.STRENGTH && <p className="text-slate-300 mb-1"><span className="font-semibold">Target:</span> {currentPlanExercise.repRange} reps @ {currentPlanExercise.targetWeight || 'bodyweight'}{currentPlanExercise.targetWeight ? 'kg' : ''}</p>}
        {currentExercise.exerciseType === ExerciseType.CARDIO && <p className="text-slate-300 mb-1"><span className="font-semibold">Target:</span> {formatDuration(currentPlanExercise.duration || 0)}</p>}
        {currentPlanExercise.notes && <p className="text-slate-400 italic mb-4"><Info className="inline w-4 h-4 mr-1" />{currentPlanExercise.notes}</p>}
      </div>
      
      <div className="flex-grow overflow-y-auto pr-2 -mr-2">
        {currentExercise.exerciseType === ExerciseType.STRENGTH && (
            <div className="space-y-4">
              {(strengthSessionData[currentExercise.id] || []).map((_, setIndex) => (
                <div key={setIndex} className="bg-slate-800 p-4 rounded-lg shadow-md">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-lg font-bold text-white">Set {setIndex + 1}</span>
                    <div className="text-xs text-slate-400 flex items-center"><History className="w-4 h-4 mr-1" /><span>Previous: {previousPerformance?.sets?.[setIndex] ? `${previousPerformance.sets[setIndex].weight}kg x ${previousPerformance.sets[setIndex].reps}` : 'N/A'}</span></div>
                  </div>
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <label htmlFor={`weight-${setIndex}`} className="block text-sm font-medium text-slate-300 mb-1">Weight (kg)</label>
                      <input id={`weight-${setIndex}`} type="number" placeholder="0" value={strengthSessionData[currentExercise.id]?.[setIndex]?.weight || ''} onChange={(e) => handleStrengthChange(currentExercise.id, setIndex, 'weight', e.target.value)} className="w-full bg-slate-700 border-slate-600 rounded-md p-2 text-white" />
                    </div>
                    <div className="flex-1">
                      <label htmlFor={`reps-${setIndex}`} className="block text-sm font-medium text-slate-300 mb-1">Reps</label>
                      <input id={`reps-${setIndex}`} type="number" placeholder="0" value={strengthSessionData[currentExercise.id]?.[setIndex]?.reps || ''} onChange={(e) => handleStrengthChange(currentExercise.id, setIndex, 'reps', e.target.value)} className="w-full bg-slate-700 border-slate-600 rounded-md p-2 text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
        )}
        {currentExercise.exerciseType === ExerciseType.CARDIO && (
            <div className="bg-slate-800 p-4 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-lg font-bold text-white">Log Performance</span>
                    <div className="text-xs text-slate-400 flex items-center"><History className="w-4 h-4 mr-1" /><span>Previous: {previousPerformance?.cardioPerformance ? `${formatDuration(previousPerformance.cardioPerformance.duration)}, ${previousPerformance.cardioPerformance.distance || 0}km` : 'N/A'}</span></div>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Time Completed</label>
                        <div className="flex space-x-2">
                           <input type="number" placeholder="Mins" value={cardioSessionData[currentExercise.id]?.minutes || ''} onChange={e => handleCardioChange(currentExercise.id, 'minutes', e.target.value)} className="w-full bg-slate-700 p-2 rounded-md" />
                           <input type="number" placeholder="Secs" value={cardioSessionData[currentExercise.id]?.seconds || ''} onChange={e => handleCardioChange(currentExercise.id, 'seconds', e.target.value)} className="w-full bg-slate-700 p-2 rounded-md" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Distance (km)</label>
                        <input type="number" placeholder="0" value={cardioSessionData[currentExercise.id]?.distance || ''} onChange={e => handleCardioChange(currentExercise.id, 'distance', e.target.value)} className="w-full bg-slate-700 p-2 rounded-md" />
                    </div>
                </div>
            </div>
        )}
      </div>
      
      <div className="flex-shrink-0 mt-6 pt-4 border-t border-slate-800">
        <div className="flex justify-between items-center">
          <button onClick={() => setCurrentExerciseIndex(prev => Math.max(0, prev - 1))} disabled={currentExerciseIndex === 0} className="flex items-center px-4 py-2 bg-slate-700 rounded-lg disabled:opacity-50 hover:bg-slate-600"><ChevronLeft className="w-5 h-5 mr-1" /> Previous</button>
          {currentExerciseIndex === plan.exercises.length - 1 ? (
            <button onClick={handleFinishWorkout} className="px-6 py-3 bg-electric-blue-600 text-white font-bold rounded-lg hover:bg-electric-blue-500 flex items-center"><Check className="w-5 h-5 mr-2" /> Finish Workout</button>
          ) : (
            <button onClick={() => setCurrentExerciseIndex(prev => Math.min(plan.exercises.length - 1, prev + 1))} disabled={currentExerciseIndex === plan.exercises.length - 1} className="flex items-center px-4 py-2 bg-slate-700 rounded-lg disabled:opacity-50 hover:bg-slate-600">Next <ChevronRight className="w-5 h-5 ml-1" /></button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkoutSession;
