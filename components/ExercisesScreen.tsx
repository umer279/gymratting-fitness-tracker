import React, { useState } from 'react';
import { useFitness } from '../context/FitnessContext';
import { Exercise, ExerciseCategory, ExerciseType } from '../types';
import { EXERCISE_CATEGORIES } from '../constants';
import { Plus, Tag, Zap, Weight, Trash2, Edit, Save, X } from 'lucide-react';

const EditExerciseModal: React.FC<{ exercise: Exercise; onSave: (exercise: Exercise) => void; onCancel: () => void; }> = ({ exercise, onSave, onCancel }) => {
    const [name, setName] = useState(exercise.name);
    const [category, setCategory] = useState(exercise.category);
    const [exerciseType, setExerciseType] = useState(exercise.exerciseType);

    const handleSave = () => {
        if(name.trim()) {
            onSave({ ...exercise, name: name.trim(), category, exerciseType });
        }
    }

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg relative">
                <button onClick={onCancel} className="absolute top-3 right-3 text-slate-400 hover:text-white"><X /></button>
                <h2 className="text-2xl font-bold mb-6 text-white">Edit Exercise</h2>
                <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Exercise Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-700 p-2 rounded-md" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value as ExerciseCategory)} className="w-full bg-slate-700 p-2 rounded-md">
                            {EXERCISE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Exercise Type</label>
                        <div className="flex rounded-lg bg-slate-900 p-1 w-full">
                            <button type="button" onClick={() => setExerciseType(ExerciseType.STRENGTH)} className={`flex-1 flex items-center justify-center p-2 rounded-md text-sm font-semibold transition-colors ${exerciseType === ExerciseType.STRENGTH ? 'bg-electric-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}><Weight className="w-4 h-4 mr-2" />Strength</button>
                            <button type="button" onClick={() => setExerciseType(ExerciseType.CARDIO)} className={`flex-1 flex items-center justify-center p-2 rounded-md text-sm font-semibold transition-colors ${exerciseType === ExerciseType.CARDIO ? 'bg-electric-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}><Zap className="w-4 h-4 mr-2" />Cardio</button>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                    <button onClick={onCancel} className="px-4 py-2 bg-slate-600 rounded-lg hover:bg-slate-500">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-electric-blue-600 text-white font-bold rounded-lg hover:bg-electric-blue-500 flex items-center"><Save className="w-4 h-4 mr-2"/> Save Changes</button>
                </div>
            </div>
        </div>
    );
};

const ExercisesScreen: React.FC = () => {
  const { state, addExercise, updateExercise, deleteExercise } = useFitness();
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseCategory, setNewExerciseCategory] = useState<ExerciseCategory>(ExerciseCategory.CHEST);
  const [newExerciseType, setNewExerciseType] = useState<ExerciseType>(ExerciseType.STRENGTH);
  const [filter, setFilter] = useState<ExerciseCategory | 'ALL'>('ALL');
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  const handleAddExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (newExerciseName.trim()) {
      addExercise({
        name: newExerciseName.trim(),
        category: newExerciseCategory,
        exerciseType: newExerciseType,
      });
      setNewExerciseName('');
    }
  };

  const handleUpdateExercise = async (exercise: Exercise) => {
    await updateExercise(exercise);
    setEditingExercise(null);
  }
  
  const handleDeleteExercise = (id: string) => {
      if(window.confirm("Are you sure you want to delete this exercise? This might affect existing workout plans.")) {
          deleteExercise(id);
      }
  }

  const filteredExercises = filter === 'ALL'
    ? state.exercises
    : state.exercises.filter(ex => ex.category === filter);

  return (
    <div className="p-4 md:p-8">
      {editingExercise && <EditExerciseModal exercise={editingExercise} onSave={handleUpdateExercise} onCancel={() => setEditingExercise(null)} />}
      <h1 className="text-3xl md:text-4xl font-bold mb-6">Exercise Library</h1>
      
      <div className="bg-slate-800 p-6 rounded-lg mb-8 shadow-md border border-slate-700">
        <h2 className="text-xl font-semibold mb-4">Add New Exercise</h2>
        <form onSubmit={handleAddExercise} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Exercise Name</label>
                    <input
                        type="text"
                        value={newExerciseName}
                        onChange={(e) => setNewExerciseName(e.target.value)}
                        placeholder="e.g., Bench Press"
                        className="w-full bg-slate-700 border-slate-600 rounded-md p-3 text-white placeholder-slate-400 focus:ring-electric-blue-500 focus:border-electric-blue-500"
                        required
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                    <select
                        value={newExerciseCategory}
                        onChange={(e) => setNewExerciseCategory(e.target.value as ExerciseCategory)}
                        className="w-full bg-slate-700 border-slate-600 rounded-md p-3 text-white focus:ring-electric-blue-500 focus:border-electric-blue-500"
                    >
                        {EXERCISE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Exercise Type</label>
                <div className="flex rounded-lg bg-slate-900 p-1 w-full md:w-auto">
                    <button type="button" onClick={() => setNewExerciseType(ExerciseType.STRENGTH)} className={`flex-1 flex items-center justify-center p-2 rounded-md text-sm font-semibold transition-colors ${newExerciseType === ExerciseType.STRENGTH ? 'bg-electric-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}><Weight className="w-4 h-4 mr-2" />Strength</button>
                    <button type="button" onClick={() => setNewExerciseType(ExerciseType.CARDIO)} className={`flex-1 flex items-center justify-center p-2 rounded-md text-sm font-semibold transition-colors ${newExerciseType === ExerciseType.CARDIO ? 'bg-electric-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}><Zap className="w-4 h-4 mr-2" />Cardio</button>
                </div>
            </div>
            <button
                type="submit"
                className="w-full flex items-center justify-center py-3 px-5 bg-electric-blue-600 text-white font-bold rounded-lg hover:bg-electric-blue-500 transition-colors"
            >
                <Plus className="w-5 h-5 mr-2" />
                Add Exercise
            </button>
        </form>
      </div>

      <div>
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
              <button onClick={() => setFilter('ALL')} className={`px-3 py-1 text-sm rounded-full transition-colors ${filter === 'ALL' ? 'bg-electric-blue-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>All</button>
            {EXERCISE_CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setFilter(cat)} className={`px-3 py-1 text-sm rounded-full transition-colors ${filter === cat ? 'bg-electric-blue-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>{cat}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredExercises.map(ex => (
            <div key={ex.id} className="bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-700 group relative">
              <p className="font-semibold text-white">{ex.name}</p>
              <div className="flex items-center mt-2 text-xs space-x-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${ex.exerciseType === ExerciseType.STRENGTH ? 'bg-blue-900 text-blue-300' : 'bg-green-900 text-green-300'}`}>
                    {ex.exerciseType === ExerciseType.STRENGTH ? <Weight className="w-3 h-3 mr-1" /> : <Zap className="w-3 h-3 mr-1" />}
                    {ex.exerciseType}
                  </span>
                  <span className="flex items-center text-slate-400"><Tag className="w-3 h-3 mr-1" />{ex.category}</span>
              </div>
              <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditingExercise(ex)} className="p-1.5 bg-slate-700/50 rounded-full text-slate-400 hover:bg-blue-500 hover:text-white transition-colors"><Edit size={14}/></button>
                  <button onClick={() => handleDeleteExercise(ex.id)} className="p-1.5 bg-slate-700/50 rounded-full text-slate-400 hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={14}/></button>
              </div>
            </div>
          ))}
           {state.exercises.length > 0 && filteredExercises.length === 0 && (
            <div className="sm:col-span-2 md:col-span-3 lg:col-span-4 text-center py-10">
                <p className="text-slate-400">No exercises found for this category.</p>
            </div>
        )}
        </div>
        {state.exercises.length === 0 && (
             <div className="text-center py-10 px-6 bg-slate-800 rounded-lg border-2 border-dashed border-slate-700">
                <p className="text-slate-400">Your exercise library is empty. Add some exercises to get started!</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ExercisesScreen;