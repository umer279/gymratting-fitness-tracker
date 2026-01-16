import React, { useState, useRef } from 'react';
import { useFitness } from '../context/FitnessContext';
import { WorkoutPlan, PlanExercise, Exercise, ExerciseType, ExerciseCategory } from '../types';
import { Plus, Play, Trash2, Edit, Save, X, Dumbbell, Download, Upload } from 'lucide-react';

interface PlansScreenProps {
  onStartWorkout: (plan: WorkoutPlan) => void;
}

// FIX: Corrected the Omit type for `onSave`. It was using `profile_id` which does not exist on `WorkoutPlan`,
// and it wasn't omitting `user_id`, which is added by the context when creating a new plan.
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

// Validation helpers for CSV import
const isValidCategory = (value: any): value is ExerciseCategory => {
    return Object.values(ExerciseCategory).includes(value);
};
const isValidType = (value: any): value is ExerciseType => {
    return Object.values(ExerciseType).includes(value);
};

const PlansScreen: React.FC<PlansScreenProps> = ({ onStartWorkout }) => {
  const { state, addPlan, updatePlan, deletePlan, addExercise } = useFitness();
  const [isCreating, setIsCreating] = useState(false);
  const [editingPlan, setEditingPlan] = useState<WorkoutPlan | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  // FIX: Corrected the Omit type for `planData`. It was using `profile_id` which does not exist on `WorkoutPlan`.
  // It should omit `id` and `user_id` for new plans, as `user_id` is handled by the context.
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

    const headers = ["Exercise Name", "Category", "Type", "Sets", "Rep Range", "Target Weight (kg)", "Duration (min)", "Notes"];
    
    const rows = plan.exercises.map(planEx => {
        const exerciseDetails = state.exercises.find(ex => ex.id === planEx.exerciseId);
        if (!exerciseDetails) return null;

        const row = [
            exerciseDetails.name, exerciseDetails.category, exerciseDetails.exerciseType,
            planEx.numberOfSets || '', planEx.repRange || '', planEx.targetWeight || '',
            planEx.duration ? planEx.duration / 60 : '', planEx.notes || ''
        ];
        
        return row.map(val => {
            const strVal = String(val);
            // Quote value if it contains a comma or a quote
            if (strVal.includes(',') || strVal.includes('"')) {
                return `"${strVal.replace(/"/g, '""')}"`;
            }
            return strVal;
        }).join(',');
    }).filter(Boolean);

    const csvContent = [
        `"Plan Name:","${plan.name.replace(/"/g, '""')}"`,
        headers.join(','),
        ...rows
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gymratting-plan-${plan.name.replace(/\s+/g, '_')}.csv`;
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
        const lines = text.trim().replace(/\r/g, '').split('\n');
        if (lines.length < 2) throw new Error("Invalid CSV: Must have a plan name, headers, and at least one exercise row.");

        const planNameLine = lines[0].split(',');
        if (!planNameLine[0].toLowerCase().includes("plan name") || !planNameLine[1]) {
            throw new Error("Invalid CSV: 'Plan Name:' not found in the first line.");
        }
        const importedPlanName = planNameLine[1].replace(/"/g, '').trim();

        const headers = lines[1].split(',').map(h => h.trim().replace(/"/g, ''));
        const headerMap = headers.reduce((acc, header, index) => {
            acc[header] = index;
            return acc;
        }, {} as Record<string, number>);

        const exerciseLines = lines.slice(2);

        // Step 1: Parse all lines into a structured format and validate
        const parsedData = exerciseLines.map((line, lineIndex) => {
            const values = line.split(','); // NOTE: Simple split, assumes no unquoted commas in values.
            const rowNum = lineIndex + 3;

            const name = (values[headerMap["Exercise Name"]] || '').trim().replace(/"/g, '');
            const category = (values[headerMap["Category"]] || '').trim().replace(/"/g, '');
            const exerciseType = (values[headerMap["Type"]] || '').trim().replace(/"/g, '');
            
            if (!name) return null; // Skip empty lines

            if (!isValidCategory(category)) {
            throw new Error(`Invalid category "${category}" on row ${rowNum}. Must be one of: ${Object.values(ExerciseCategory).join(', ')}`);
            }
            if (!isValidType(exerciseType)) {
            throw new Error(`Invalid type "${exerciseType}" on row ${rowNum}. Must be one of: ${Object.values(ExerciseType).join(', ')}`);
            }

            const planInfo: Partial<PlanExercise> = {};
            const numSets = (values[headerMap["Sets"]] || '').trim().replace(/"/g, '');
            const repRange = (values[headerMap["Rep Range"]] || '').trim().replace(/"/g, '');
            const targetWeight = (values[headerMap["Target Weight (kg)"]] || '').trim().replace(/"/g, '');
            const durationMin = (values[headerMap["Duration (min)"]] || '').trim().replace(/"/g, '');
            const notes = (values[headerMap["Notes"]] || '').trim().replace(/"/g, '');
            
            if (exerciseType === ExerciseType.STRENGTH) {
                if (numSets) planInfo.numberOfSets = parseInt(numSets, 10);
                if (repRange) planInfo.repRange = repRange;
                if (targetWeight) planInfo.targetWeight = parseInt(targetWeight, 10);
            } else {
                if (durationMin) planInfo.duration = parseInt(durationMin, 10) * 60;
            }
            if (notes) planInfo.notes = notes;

            return { name, category, exerciseType, planInfo };
        }).filter(Boolean);


        // Step 2: Identify unique new exercises that need to be created.
        const exercisesToCreate = new Map<string, { name: string, category: ExerciseCategory, exerciseType: ExerciseType }>();
        parsedData.forEach(p => {
            if (p) { // Check p is not null
                const existing = state.exercises.find(e => e.name.toLowerCase() === p.name.toLowerCase());
                if (!existing) {
                    exercisesToCreate.set(p.name.toLowerCase(), { name: p.name, category: p.category, exerciseType: p.exerciseType });
                }
            }
        });

        // Step 3: Create the new exercises sequentially.
        const createdExercises: Exercise[] = [];
        for (const exerciseData of exercisesToCreate.values()) {
            const newExercise = await addExercise(exerciseData);
            if (!newExercise) {
                throw new Error(`Failed to create new exercise "${exerciseData.name}". Import aborted. Please check for database constraints or connection issues.`);
            }
            createdExercises.push(newExercise);
        }

        // Step 4: Build the final list of PlanExercise objects.
        const allAvailableExercises = [...state.exercises, ...createdExercises];

        const resolvedPlanExercises = parsedData.map(p => {
            if (!p) return null; // Should not happen due to filter
            const exercise = allAvailableExercises.find(e => e.name.toLowerCase() === p.name.toLowerCase());
            if (!exercise) {
                throw new Error(`Critical error: Could not find exercise "${p.name}" after creation phase.`);
            }
            return {
                exerciseId: exercise.id,
                ...p.planInfo
            } as PlanExercise;
        }).filter(Boolean) as PlanExercise[];

        if (resolvedPlanExercises.length === 0) {
            throw new Error("No valid exercises found in the imported file.");
        }

        // Step 5: Create the plan
        let newPlanName = importedPlanName;
        let nameCounter = 1;
        while (state.plans.some(p => p.name === newPlanName)) {
            newPlanName = `${importedPlanName} (Imported ${nameCounter++})`;
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
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
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