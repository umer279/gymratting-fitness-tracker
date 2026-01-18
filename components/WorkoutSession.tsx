

import React, { useState, useEffect, useMemo } from 'react';
import { WorkoutPlan, PerformedSet, PerformedExercise, PlanExercise, ExerciseType, Exercise } from '../types';
import { useFitness } from '../context/FitnessContext';
import { ChevronLeft, ChevronRight, Check, History, Info, Edit, ArrowUp, ArrowDown, Replace, Trash2, X } from 'lucide-react';
import ExerciseSelectionModal from './ExerciseSelectionModal';
import { useLanguage } from '../context/LanguageContext';

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
    const { t } = useLanguage();
    const getExerciseName = (id: string) => state.exercises.find(e => e.id === id)?.name || t('unknown_exercise');

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">{t('edit_session_title')}</h2>
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
  const { t, tCategory } = useLanguage();
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
    setCardioSessionData({ ...cardioSessionData, [exerciseId]: { ...(cardioSessionData[exerciseId] || { minutes: '', seconds: '', distance: '' }), [field]: value }});
  }

  const handleNoteChange = (exerciseId: string, text: string) => {
    setSessionNotes(prev => ({...prev, [exerciseId]: text}));
  }

  const handleFinishWorkout = async () => {
    const duration = Math.floor((Date.now() - startTime) / 1000);
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
      await addWorkoutToHistory(newHistoryItem);
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
    if (currentExerciseIndex === fromIndex) {
        setCurrentExerciseIndex(toIndex);
    } else if (currentExerciseIndex > fromIndex && currentExerciseIndex <= toIndex) {
        setCurrentExerciseIndex(currentExerciseIndex - 1);
    } else if (currentExerciseIndex < fromIndex && currentExerciseIndex >= toIndex) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };

  const handleRemoveExercise = (indexToRemove: number) => {
    setSessionExercises(prev => prev.filter((_, i) => i !== indexToRemove));
    if (currentExerciseIndex >= indexToRemove) {
        setCurrentExerciseIndex(prev => Math.max(0, prev - 1));
    }
  };
  
  const handleStartReplaceExercise = (index: number) => {
    setExerciseToReplaceIndex(index);
    setIsEditingSession(false);
    setIsSelectingExercise(true);
  };
  
  const handleSelectReplacement = (newExerciseId: string) => {
    if (exerciseToReplaceIndex !== null) {
      const exercise = state.exercises.find(e => e.id === newExerciseId);
      if (exercise) {
        const newPlanExercise: PlanExercise = { exerciseId: newExerciseId };
        if (exercise.exerciseType === ExerciseType.STRENGTH) {
          newPlanExercise.numberOfSets = 3;
          newPlanExercise.repRange = '8-12';
        } else {
          newPlanExercise.duration = 600;
        }
        
        setSessionExercises(prev => {
          const newList = [...prev];
          newList[exerciseToReplaceIndex] = newPlanExercise;
          return newList;
        });
      }
    }
    setIsSelectingExercise(false);
    setExerciseToReplaceIndex(null);
  };

  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };
  
  if (!currentExercise || !currentPlanExercise) {
    return <div className="p-4 text-center">{t('loading')}</div>;
  }

  const currentSets = strengthSessionData[currentExercise.id] || [];
  const currentCardio = cardioSessionData[currentExercise.id] || { minutes: '', seconds: '', distance: '' };
  
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col p-4 md:p-6 text-white">
      {isEditingSession && (
        <EditSessionModal
            exercises={sessionExercises}
            onReorder={handleReorderExercise}
            onRemove={handleRemoveExercise}
            onStartReplace={handleStartReplaceExercise}
            onClose={() => setIsEditingSession(false)}
        />
      )}
      {isSelectingExercise && (
        <ExerciseSelectionModal
            onSelect={handleSelectReplacement}
            onCancel={() => { setIsSelectingExercise(false); setExerciseToReplaceIndex(null); }}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold truncate">{plan.name}</h1>
            <p className="text-slate-400 font-mono text-lg">{formatTime(elapsedTime)}</p>
        </div>
        <button onClick={handleFinishWorkout} className="px-4 py-2 bg-red-600 font-bold rounded-lg hover:bg-red-500 transition-colors">{t('workout_session_finish_button')}</button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-700 rounded-full h-2.5 mb-4">
        <div className="bg-electric-blue-600 h-2.5 rounded-full" style={{ width: `${((currentExerciseIndex + 1) / sessionExercises.length) * 100}%` }}></div>
      </div>
      
      <div className="flex-grow overflow-y-auto pr-2 -mr-2">
        {/* Exercise Info */}
        <div className="text-center mb-4">
            <h2 className="text-3xl md:text-4xl font-bold text-electric-blue-400">{currentExercise.name}</h2>
            <p className="text-slate-400">{tCategory(currentExercise.category)}</p>
        </div>
        
        {/* Previous Performance */}
        {previousPerformance && (
          <div className="bg-slate-800 p-3 rounded-lg mb-4 border border-slate-700">
            <h3 className="flex items-center text-sm font-semibold text-slate-300 mb-2"><History size={14} className="mr-2"/> {t('workout_session_previous_performance_title')}</h3>
            {previousPerformance.sets && previousPerformance.sets.length > 0 && (
              <div className="text-xs text-slate-400 grid grid-cols-3 gap-1">
                {previousPerformance.sets.map((s, i) => <span key={i} className="font-mono bg-slate-700/50 p-1 rounded">{s.weight}kg x {s.reps}</span>)}
              </div>
            )}
            {previousPerformance.cardioPerformance && (
              <p className="text-sm font-mono text-slate-300">
                {formatDuration(previousPerformance.cardioPerformance.duration)}
                {previousPerformance.cardioPerformance.distance ? ` / ${previousPerformance.cardioPerformance.distance}km` : ''}
              </p>
            )}
          </div>
        )}
        
        {/* Plan Details */}
        <div className="bg-slate-800 p-3 rounded-lg mb-4 border border-slate-700">
            <h3 className="flex items-center text-sm font-semibold text-slate-300 mb-2"><Info size={14} className="mr-2"/> {t('workout_session_plan_details_title')}</h3>
            {currentExercise.exerciseType === ExerciseType.STRENGTH && <p className="text-sm text-slate-300">{t('workout_session_plan_details_strength', { sets: currentPlanExercise.numberOfSets, reps: currentPlanExercise.repRange })}</p>}
            {currentExercise.exerciseType === ExerciseType.CARDIO && <p className="text-sm text-slate-300">{t('workout_session_plan_details_cardio', { duration: formatDuration(currentPlanExercise.duration || 0) })}</p>}
            {currentPlanExercise.notes && <p className="text-xs italic text-slate-400 mt-1">{currentPlanExercise.notes}</p>}
        </div>

        {/* Live Input */}
        <div className="bg-slate-900 p-4 rounded-lg">
          {currentExercise.exerciseType === ExerciseType.STRENGTH && (
            <div className="space-y-3">
              {currentSets.map((set, setIndex) => (
                <div key={setIndex} className="grid grid-cols-3 gap-2 items-center">
                  <span className="font-bold text-slate-300">{t('table_header_set')} {setIndex + 1}</span>
                  <input type="number" placeholder="kg" value={set.weight} onChange={e => handleStrengthChange(currentExercise.id, setIndex, 'weight', e.target.value)} className="w-full bg-slate-700 p-2 rounded-md text-center" />
                  <input type="number" placeholder={t('table_header_reps')} value={set.reps} onChange={e => handleStrengthChange(currentExercise.id, setIndex, 'reps', e.target.value)} className="w-full bg-slate-700 p-2 rounded-md text-center" />
                </div>
              ))}
            </div>
          )}
          {currentExercise.exerciseType === ExerciseType.CARDIO && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 items-center">
                <label className="font-bold text-slate-300 text-sm">{t('workout_session_timer_elapsed')}</label>
                <input type="number" placeholder="min" value={currentCardio.minutes} onChange={e => handleCardioChange(currentExercise.id, 'minutes', e.target.value)} className="w-full bg-slate-700 p-2 rounded-md text-center" />
                <input type="number" placeholder="sec" value={currentCardio.seconds} onChange={e => handleCardioChange(currentExercise.id, 'seconds', e.target.value)} className="w-full bg-slate-700 p-2 rounded-md text-center" />
              </div>
              <div className="grid grid-cols-3 gap-2 items-center">
                <label className="font-bold text-slate-300 text-sm">{t('cardio_distance')}</label>
                <input type="number" step="0.1" placeholder="km" value={currentCardio.distance} onChange={e => handleCardioChange(currentExercise.id, 'distance', e.target.value)} className="w-full col-span-2 bg-slate-700 p-2 rounded-md text-center" />
              </div>
            </div>
          )}
           <textarea
            value={sessionNotes[currentExercise.id] || ''}
            onChange={(e) => handleNoteChange(currentExercise.id, e.target.value)}
            placeholder={t('workout_session_notes_placeholder')}
            rows={2}
            className="w-full bg-slate-700 p-2 rounded-md mt-4 text-sm"
          />
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-700 flex-shrink-0">
        <button onClick={() => setCurrentExerciseIndex(i => Math.max(0, i - 1))} disabled={currentExerciseIndex === 0} className="flex items-center p-3 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50">
          <ChevronLeft /> <span className="hidden sm:inline ml-2">{t('workout_session_nav_previous')}</span>
        </button>
        <button onClick={() => setIsEditingSession(true)} className="flex items-center text-sm p-3 rounded-lg bg-slate-800 hover:bg-slate-700">
          <Edit size={16} className="mr-2" /> {t('workout_session_nav_edit')}
        </button>
        {currentExerciseIndex === sessionExercises.length - 1 ? (
          <button onClick={handleFinishWorkout} className="flex items-center p-3 rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold">
            <Check /><span className="hidden sm:inline ml-2">{t('workout_session_nav_finish')}</span>
          </button>
        ) : (
          <button onClick={() => setCurrentExerciseIndex(i => Math.min(sessionExercises.length - 1, i + 1))} disabled={currentExerciseIndex === sessionExercises.length - 1} className="flex items-center p-3 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50">
            <span className="hidden sm:inline mr-2">{t('workout_session_nav_next')}</span><ChevronRight />
          </button>
        )}
      </div>
    </div>
  );
};

export default WorkoutSession;