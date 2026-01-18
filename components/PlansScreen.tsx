import React, { useState, useRef } from 'react';
import { useFitness } from '../context/FitnessContext';
import { WorkoutPlan, PlanExercise, Exercise, ExerciseType } from '../types';
import { Plus, Play, Trash2, Edit, Save, X, Dumbbell, Download, Upload } from 'lucide-react';

const PlanForm: React.FC<{ plan?: WorkoutPlan; onSave: (plan: Omit<WorkoutPlan, 'id' | 'user_id'> | WorkoutPlan) => void; onCancel: () => void; exercises: Exercise[] }> = ({ plan, onSave, onCancel, exercises }) => {
  const [name, setName] = useState(plan?.name || '');
  const [planExercises, setPlanExercises] = useState<PlanExercise[]>(plan?.exercises || []);
  
  const handleAddExercise = () => {
    if (exercises.length > 0) {
      const firstExercise = exercises[0];
      const newPlanExercise: PlanExercise = { exerciseId: firstExercise.id, notes: '' };
      if (firstExercise.exerciseType === ExerciseType.STRENGTH) {
        newPlanExercise.numberOfSets = 3;
        newPlanExercise.repRange = '8-12';
      } else {
        newPlanExercise.duration = 600;
      }
      setPlanExercises([...planExercises, newPlanExercise]);
    }
  };

  const handleExerciseChange = <T extends keyof PlanExercise>(index: number, field: T, value: PlanExercise[T]) => {
    const updated = [...planExercises];
    const currentExerciseInPlan = updated[index];
    
    if (field === 'exerciseId') {
      const newExercise = exercises.find(ex => ex.id === value);
      updated[index].exerciseId = value as string;

      if (currentExerciseInPlan.exerciseId !== newExercise?.id) {
          const newDetails: PlanExercise = { exerciseId: value as string };
          if (newExercise?.exerciseType === ExerciseType.STRENGTH) {
            newDetails.numberOfSets = 3; newDetails.repRange = '8-12';
          } else {
            newDetails.duration = 600;
          }
          updated[index] = newDetails;
      }
    } else {
      updated[index] = {...currentExerciseInPlan, [field]: value};
    }
    setPlanExercises(updated);
  };

  const handleRemoveExercise = (index: number) => {
    setPlanExercises(planExercises.filter((_, i) => i !== index));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && planExercises.length > 0) {
        const planData = { name, exercises: planExercises };
        if (plan) {
            onSave({ ...plan, ...planData });
        } else {
            onSave(planData);
        }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
            <h2 className="text-2xl font-bold mb-4 text-white">{plan ? 'Edit' : 'Create'} Plan</h2>
            <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-2 -mr-2">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Plan Name (e.g., Push Day)" className="w-full bg-slate-700 border-slate-600 rounded-md p-2 mb-4 text-white placeholder-slate-400" required />
                <div className="space-y-4">
                    {planExercises.map((pe, index) => {
                        const exercise = exercises.find(ex => ex.id === pe.exerciseId);
                        return (
                        <div key={index} className="bg-slate-900 p-4 rounded-lg border border-slate-700 relative">
                           <button type="button" onClick={() => handleRemoveExercise(index)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500"><X size={18}/></button>
                            <select value={pe.exerciseId} onChange={(e) => handleExerciseChange(index, 'exerciseId', e.target.value)} className="w-full bg-slate-700 p-2 rounded-md mb-2">
                                {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name} ({ex.exerciseType})</option>)}
                            </select>
                            
                            {exercise?.exerciseType === ExerciseType.STRENGTH && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                                    <input type="number" value={pe.numberOfSets || ''} onChange={e => handleExerciseChange(index, 'numberOfSets', parseInt(e.target.value))} placeholder="Sets" className="w-full bg-slate-700 p-2 rounded-md" />
                                    <input type="text" value={pe.repRange || ''} onChange={e => handleExerciseChange(index, 'repRange', e.target.value)} placeholder="Rep Range" className="w-full bg-slate-700 p-2 rounded-md" />
                                    <input type="number" value={pe.targetWeight || ''} onChange={e => handleExerciseChange(index, 'targetWeight', parseInt(e.target.value))} placeholder="Target kg" className="w-full bg-slate-700 p-2 rounded-md" />
                                </div>
                            )}

                            {exercise?.exerciseType === ExerciseType.CARDIO && (
                                <div className="grid grid-cols-1 gap-2 mb-2">
                                     <input type="number" value={(pe.duration || 0) / 60} onChange={e => handleExerciseChange(index, 'duration', parseInt(e.target.value) * 60)} placeholder="Duration (min)" className="w-full bg-slate-700 p-2 rounded-md" />
                                </div>
                            )}

                            <textarea value={pe.notes || ''} onChange={e => handleExerciseChange(index, 'notes', e.target.value)} placeholder={exercise?.exerciseType === 'Cardio' ? "Intensity, Incline, etc." : "Notes (e.g., focus on form)"} rows={2} className="w-full bg-slate-700 p-2 rounded-md" />
                        </div>
                    )})}
                </div>
                <button type="button" onClick={handleAddExercise} className="mt-4 w-full flex items-center justify-center py-2 px-4 border-2 border-dashed border-slate-600 text-slate-400 rounded-lg hover:bg-slate-700 hover:text-white">
                    <Dumbbell className="w-4 h-4 mr-2" /> Add Exercise
                </button>
            </form>
             <div className="flex justify-end space-x-4 mt-6 flex-shrink-0">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-600 rounded-lg hover:bg-slate-500">Cancel</button>
                <button type="submit" onClick={handleSubmit} className="px-4 py-2 bg-electric-blue-600 text-white font-bold rounded-lg hover:bg-electric-blue-500 flex items-center"><Save className="w-4 h-4 mr-2"/> Save Plan</button>
            </div>
        </div>
    </div>
  )
};

// FIX: Define PlansScreenProps interface for the component props.
interface PlansScreenProps {
  onStartWorkout: (plan: WorkoutPlan) => void;
}

const PlansScreen: React.FC<PlansScreenProps> = ({ onStartWorkout }) => {
  const { state, addPlan, updatePlan, deletePlan, addExercise } = useFitness();
  const [isCreating, setIsCreating] = useState(false);
  const [editingPlan, setEditingPlan] = useState<WorkoutPlan | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSavePlan = (planData: Omit<WorkoutPlan, 'id' | 'user_id'> | WorkoutPlan) => {
    if ('id' in planData) {
        updatePlan(planData as WorkoutPlan);
    } else {
        addPlan(planData as Omit<WorkoutPlan, 'id' | 'user_id'>);
    }
    setIsCreating(false);
    setEditingPlan(null);
  };

  const handleDeletePlan = (id: string) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
        deletePlan(id);
    }
  }

  const getExerciseName = (id: string) => state.exercises.find(e => e.id === id)?.name || 'Unknown Exercise';

  const handleExportPlan = (planId: string) => {
    const plan = state.plans.find(p => p.id === planId);
    if (!plan) return;

    const exportablePlan = {
      name: plan.name,
      exercises: plan.exercises.map(planEx => {
        const exerciseDetails = state.exercises.find(ex => ex.id === planEx.exerciseId);
        if (!exerciseDetails) return null;

        const { id, user_id, ...exerciseData } = exerciseDetails;
        const { exerciseId, ...planDetails } = planEx;

        if (planDetails.duration) {
            // @ts-ignore
            planDetails.duration = planDetails.duration / 60; // Store as minutes in JSON
        }

        return {
          exercise: exerciseData,
          planDetails: planDetails,
        };
      }).filter(Boolean),
    };

    const jsonContent = JSON.stringify(exportablePlan, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gymratting-plan-${plan.name.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
        const text = await file.text();
        const importedPlanData = JSON.parse(text);

        if (!importedPlanData.name || !Array.isArray(importedPlanData.exercises)) {
            throw new Error("Invalid JSON format. Must include a 'name' and an 'exercises' array.");
        }

        const resolvedPlanExercises: PlanExercise[] = [];

        for (const item of importedPlanData.exercises) {
            if (!item.exercise || !item.exercise.name || !item.exercise.category || !item.exercise.exerciseType) {
                console.warn("Skipping invalid exercise item in JSON:", item);
                continue;
            }

            let exerciseId = state.exercises.find(e => e.name.toLowerCase() === item.exercise.name.toLowerCase())?.id;

            if (!exerciseId) {
                const newExercise = await addExercise({
                    name: item.exercise.name,
                    category: item.exercise.category,
                    exerciseType: item.exercise.exerciseType,
                });
                if (newExercise) {
                    exerciseId = newExercise.id;
                } else {
                    throw new Error(`Failed to create new exercise "${item.exercise.name}". Import aborted.`);
                }
            }

            const planDetails = item.planDetails || {};
            if (planDetails.duration) {
                planDetails.duration = planDetails.duration * 60; // Convert minutes back to seconds
            }

            resolvedPlanExercises.push({
                exerciseId: exerciseId,
                ...planDetails,
            });
        }

        if (resolvedPlanExercises.length === 0) {
            throw new Error("No valid exercises found in the imported file.");
        }

        let newPlanName = importedPlanData.name;
        let nameCounter = 1;
        while (state.plans.some(p => p.name === newPlanName)) {
            newPlanName = `${importedPlanData.name} (Imported ${nameCounter++})`;
        }

        await addPlan({ name: newPlanName, exercises: resolvedPlanExercises });
        alert(`Plan "${newPlanName}" imported successfully!`);

    } catch (error) {
        console.error("Failed to import plan:", error);
        alert(`Error importing plan: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };


  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold">Workout Plans</h1>
        <div className="flex items-center space-x-2">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
            <button onClick={handleImportClick} className="flex items-center justify-center py-2 px-4 bg-slate-700 text-white font-bold rounded-lg hover:bg-slate-600 transition-colors">
                <Upload className="w-5 h-5 mr-2" /> Import
            </button>
            <button onClick={() => setIsCreating(true)} className="flex items-center justify-center py-2 px-4 bg-electric-blue-600 text-white font-bold rounded-lg hover:bg-electric-blue-500 transition-colors">
              <Plus className="w-5 h-5 mr-2" /> Create Plan
            </button>
        </div>
      </div>

      {(isCreating || editingPlan) && 
        <PlanForm plan={editingPlan || undefined} onSave={handleSavePlan} onCancel={() => { setIsCreating(false); setEditingPlan(null); }} exercises={state.exercises} />
      }

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.plans.map((plan) => (
          <div key={plan.id} className="bg-slate-800 rounded-lg shadow-lg p-5 flex flex-col justify-between border border-slate-700">
            <div>
              <h2 className="text-xl font-bold mb-2 text-white">{plan.name}</h2>
              <ul className="mb-4 space-y-1 text-sm text-slate-300">
                {plan.exercises.slice(0, 4).map((ex, idx) => (
                  <li key={idx} className="flex items-center">
                    <Dumbbell size={14} className="mr-2 text-slate-500" />
                    <span>{getExerciseName(ex.exerciseId)}</span>
                  </li>
                ))}
                {plan.exercises.length > 4 && <li className="text-slate-500">...and {plan.exercises.length - 4} more</li>}
              </ul>
            </div>
            <div className="flex items-center space-x-2">
                <button onClick={() => onStartWorkout(plan)} className="flex-1 flex items-center justify-center py-2 px-4 bg-electric-blue-600 text-white font-bold rounded-lg hover:bg-electric-blue-500 transition-colors">
                    <Play className="w-4 h-4 mr-2" /> Start
                </button>
                 <button onClick={() => handleExportPlan(plan.id)} className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600"><Download size={18} /></button>
                 <button onClick={() => setEditingPlan(plan)} className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600"><Edit size={18} /></button>
                 <button onClick={() => handleDeletePlan(plan.id)} className="p-2 bg-slate-700 rounded-lg hover:bg-red-500"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
        {state.plans.length === 0 && (
            <div className="md:col-span-3 text-center py-10 px-6 bg-slate-800 rounded-lg border-2 border-dashed border-slate-700">
                <p className="text-slate-400">No workout plans yet. Create your first one to get started!</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default PlansScreen;