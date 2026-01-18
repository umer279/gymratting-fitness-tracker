import React, { useState, useEffect, useMemo } from 'react';
import { WorkoutPlan, PerformedSet, PerformedExercise, PlanExercise, ExerciseType, Exercise } from '../types';
import { useFitness } from '../context/FitnessContext';
import { ChevronLeft, ChevronRight, Check, History, Info, Edit, ArrowUp, ArrowDown, Replace, Trash2, X } from 'lucide-react';
import ExerciseSelectionModal from './ExerciseSelectionModal';

interface WorkoutSessionProps {
  plan: WorkoutPlan;
  onFinish: () => void;
}

type StrengthSessionSet = { weight: string; reps: string };
type CardioSessionData = { minutes: string; seconds: string; distance: string; };

const EditSessionModal: React.FC<{
    exercises: PlanExercise[];
    onReorder: (from: number, to: number) => void;
    onRemove: (index: number) => void;
    onStartReplace: (index: number) => void;
    onClose: () => void;
}> = ({ exercises, onReorder, onRemove, onStartReplace, onClose }) => {
    const { state } = useFitness();
    const getExerciseName = (id: string) => state.exercises.find(e => e.id === id)?.name || 'Unknown Exercise';

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Edit Workout</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X /></button>
                </div>
                <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-2">
                    {exercises.map((pe, index) => (
                        <div key={`${pe.exerciseId}-${index}`} className="bg-slate-900 p-3 rounded-lg flex items-center justify-between">
                            <span className="font-semibold text-white truncate">{index + 1}. {getExerciseName(pe.exerciseId)}</span>
                            <div className="flex items-center space-x-1 flex-shrink-0">
                                <button onClick={() => onReorder(index, index - 1)} disabled={index === 0} className="p-1.5 rounded-full hover:bg-slate-700 disabled:opacity-50"><ArrowUp size={16}/></button>
                                <button onClick={() => onReorder(index, index + 1)} disabled={index === exercises.length - 1} className="p-1.5 rounded-full hover:bg-slate-700 disabled:opacity-50"><ArrowDown size={16}/></button>
                                <button onClick={() => onStartReplace(index)} className="p-1.5 rounded-full hover:bg-slate-700 text-blue-400"><Replace size={16}/></button>
                                <button onClick={() => onRemove(index)} className="p-1.5 rounded-full hover:bg-slate-700 text-red-400"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const WorkoutSession: React.FC<WorkoutSessionProps> = ({ plan, onFinish }) => {
  const { state, addWorkoutToHistory } = useFitness();
  const [sessionExercises, setSessionExercises] = useState<PlanExercise[]>(plan.exercises);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [strengthSessionData, setStrengthSessionData] = useState<Record<string, StrengthSessionSet[]>>({});
  const [cardioSessionData, setCardioSessionData] = useState<Record<string, CardioSessionData>>({});
  const [sessionNotes, setSessionNotes] = useState<Record<string, string>>({});
  const [startTime] = useState(Date.now());

  const [isEditingSession, setIsEditingSession] = useState(false);
  const [isSelectingExercise, setIsSelectingExercise] = useState(false);
  const [exerciseToReplaceIndex, setExerciseToReplaceIndex] = useState<number | null>(null);
  
  const currentPlanExercise = sessionExercises[currentExerciseIndex];
  const currentExercise = useMemo(() => 
    state.exercises.find(ex => ex.id === currentPlanExercise?.exerciseId),
    [state.exercises, currentPlanExercise]
  );

  useEffect(() => {
    const initialStrengthData: Record<string, StrengthSessionSet[]> = {};
    const initialCardioData: Record<string, CardioSessionData> = {};
    sessionExercises.forEach(pe => {
      const exercise = state.exercises.find(ex => ex.id === pe.exerciseId);
      if (exercise?.exerciseType === ExerciseType.STRENGTH) {
        initialStrengthData[pe.exerciseId] = Array(pe.numberOfSets || 3).fill({ weight: '', reps: '' });
      } else if (exercise?.exerciseType === ExerciseType.CARDIO) {
        initialCardioData[pe.exerciseId] = { minutes: String(Math.floor((pe.duration || 0) / 60)), seconds: String((pe.duration || 0) % 60), distance: '' };
      }
    });
    setStrengthSessionData(initialStrengthData);
    setCardioSessionData(initialCardioData);
  }, [sessionExercises, state.exercises]);

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
    const updatedSets = [...(strengthSessionData[exerciseId] || [])];
    updatedSets[setIndex] = { ...updatedSets[setIndex], [field]: value };
    setStrengthSessionData({ ...strengthSessionData, [exerciseId]: updatedSets });
  };
  
  const handleCardioChange = (exerciseId: string, field: keyof CardioSessionData, value: string) => {
    // FIX: Provide default values for cardio session data to ensure the object shape matches CardioSessionData type.
    setCardioSessionData({ ...cardioSessionData, [exerciseId]: { ...(cardioSessionData[exerciseId] || { minutes: '', seconds: '', distance: '' }), [field]: value }});
  }

  const handleNoteChange = (exerciseId: string, text: string) => {
    setSessionNotes(prev => ({...prev, [exerciseId]: text}));
  }

  const handleFinishWorkout = () => {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    // FIX: Add a return type to the map callback to ensure type compatibility with the PerformedExercise type predicate in the filter.
    const performedExercises: PerformedExercise[] = sessionExercises.map((planEx): PerformedExercise | null => {
        const exercise = state.exercises.find(ex => ex.id === planEx.exerciseId);
        const notes = sessionNotes[planEx.exerciseId];
        
        if (exercise?.exerciseType === ExerciseType.STRENGTH) {
            const setsData = strengthSessionData[planEx.exerciseId] || [];
            const performedSets: PerformedSet[] = setsData
              .map(s => ({ weight: parseFloat(s.weight) || 0, reps: parseInt(s.reps, 10) || 0 }))
              .filter(s => s.reps > 0);
            return (performedSets.length > 0 || notes) ? { exerciseId: planEx.exerciseId, sets: performedSets, notes } : null;
        }
        if (exercise?.exerciseType === ExerciseType.CARDIO) {
            const cardioData = cardioSessionData[planEx.exerciseId];
            const totalSeconds = (parseInt(cardioData?.minutes, 10) || 0) * 60 + (parseInt(cardioData?.seconds, 10) || 0);
            if (totalSeconds > 0 || notes) {
              return {
                exerciseId: planEx.exerciseId,
                cardioPerformance: {
                  duration: totalSeconds,
                  distance: parseFloat(cardioData.distance) || undefined,
                },
                notes
              };
            }
        }
        return null;
      }).filter((ex): ex is PerformedExercise => ex !== null);
      
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

  const handleReorderExercise = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= sessionExercises.length) return;
    const newList = [...sessionExercises];
    const [movedItem] = newList.splice(fromIndex, 1);
    newList.splice(toIndex, 0, movedItem);
    setSessionExercises(newList);
  };

  const handleRemoveExercise = (index: number) => {
    const newList = sessionExercises.filter((_, i) => i !== index);
    setSessionExercises(newList);
    if (currentExerciseIndex >= newList.length && newList.length > 0) {
        setCurrentExerciseIndex(newList.length - 1);
    } else if (newList.length === 0) {
        // Handle empty workout - maybe show a message or end it.
        alert("Workout is empty!");
        onFinish();
    }
  };

  const handleStartReplace = (index: number) => {
      setExerciseToReplaceIndex(index);
      setIsEditingSession(false);
      setIsSelectingExercise(true);
  };

  const handleConfirmReplace = (newExerciseId: string) => {
    if (exerciseToReplaceIndex === null) return;
    const newExercise = state.exercises.find(e => e.id === newExerciseId);
    if (!newExercise) return;
    
    const newList = [...sessionExercises];
    const oldPlanExercise = newList[exerciseToReplaceIndex];
    const newPlanExercise: PlanExercise = { exerciseId: newExercise.id };
    
    if (newExercise.exerciseType === oldPlanExercise.notes) {
       Object.assign(newPlanExercise, oldPlanExercise, { exerciseId: newExercise.id });
    } else { // Different type, reset details
        if(newExercise.exerciseType === ExerciseType.STRENGTH) {
            newPlanExercise.numberOfSets = 3; newPlanExercise.repRange = '8-12';
        } else {
            newPlanExercise.duration = 600;
        }
    }
    
    newList[exerciseToReplaceIndex] = newPlanExercise;
    setSessionExercises(newList);
    setIsSelectingExercise(false);
    setExerciseToReplaceIndex(null);
  };

  if (sessionExercises.length === 0) {
    return (
        <div className="p-4 md:p-8 max-w-3xl mx-auto h-screen flex flex-col items-center justify-center">
            <h1 className="text-2xl font-bold mb-4">Workout Finished</h1>
            <button onClick={onFinish} className="px-6 py-3 bg-electric-blue-600 text-white font-bold rounded-lg hover:bg-electric-blue-500">
                Go to History
            </button>
        </div>
    );
  }

  if (!currentExercise) return <div className="p-4 text-center">Loading exercise...</div>;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto h-screen flex flex-col">
       {isEditingSession && <EditSessionModal exercises={sessionExercises} onReorder={handleReorderExercise} onRemove={handleRemoveExercise} onStartReplace={handleStartReplace} onClose={() => setIsEditingSession(false)} />}
       {isSelectingExercise && <ExerciseSelectionModal onSelect={handleConfirmReplace} onCancel={() => setIsSelectingExercise(false)} />}

      <div className="flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold text-electric-blue-400">{plan.name}</h1>
                <p className="text-slate-400">Exercise {currentExerciseIndex + 1} of {sessionExercises.length}</p>
            </div>
            <button onClick={() => setIsEditingSession(true)} className="flex items-center text-sm py-2 px-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                <Edit className="w-4 h-4 mr-2" /> Edit Workout
            </button>
        </div>

        <h2 className="text-2xl md:text-3xl font-semibold mb-2">{currentExercise.name}</h2>
        {currentExercise.exerciseType === ExerciseType.STRENGTH && <p className="text-slate-300 mb-1"><span className="font-semibold">Target:</span> {currentPlanExercise.repRange} reps @ {currentPlanExercise.targetWeight || 'bodyweight'}{currentPlanExercise.targetWeight ? 'kg' : ''}</p>}
        {currentExercise.exerciseType === ExerciseType.CARDIO && <p className="text-slate-300 mb-1"><span className="font-semibold">Target:</span> {formatDuration(currentPlanExercise.duration || 0)}</p>}
        {currentPlanExercise.notes && <p className="text-slate-400 italic mb-4"><Info className="inline w-4 h-4 mr-1" />{currentPlanExercise.notes}</p>}
      </div>
      
      <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-4">
        {currentExercise.exerciseType === ExerciseType.STRENGTH && (
            (strengthSessionData[currentExercise.id] || []).map((_, setIndex) => (
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
            ))
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
        <div className="bg-slate-800 p-4 rounded-lg">
            <label htmlFor="session-notes" className="block text-sm font-medium text-slate-300 mb-2">Session Notes</label>
            <textarea
                id="session-notes"
                value={sessionNotes[currentExercise.id] || ''}
                onChange={e => handleNoteChange(currentExercise.id, e.target.value)}
                rows={3}
                placeholder="How did it feel? Any adjustments?"
                className="w-full bg-slate-700 border-slate-600 rounded-md p-2 text-white placeholder-slate-400"
            />
        </div>
      </div>
      
      <div className="flex-shrink-0 mt-6 pt-4 border-t border-slate-800">
        <div className="flex justify-between items-center">
          <button onClick={() => setCurrentExerciseIndex(prev => Math.max(0, prev - 1))} disabled={currentExerciseIndex === 0} className="flex items-center px-4 py-2 bg-slate-700 rounded-lg disabled:opacity-50 hover:bg-slate-600"><ChevronLeft className="w-5 h-5 mr-1" /> Previous</button>
          {currentExerciseIndex === sessionExercises.length - 1 ? (
            <button onClick={handleFinishWorkout} className="px-6 py-3 bg-electric-blue-600 text-white font-bold rounded-lg hover:bg-electric-blue-500 flex items-center"><Check className="w-5 h-5 mr-2" /> Finish Workout</button>
          ) : (
            <button onClick={() => setCurrentExerciseIndex(prev => Math.min(sessionExercises.length - 1, prev + 1))} disabled={currentExerciseIndex === sessionExercises.length - 1} className="flex items-center px-4 py-2 bg-slate-700 rounded-lg disabled:opacity-50 hover:bg-slate-600">Next <ChevronRight className="w-5 h-5 ml-1" /></button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkoutSession;
