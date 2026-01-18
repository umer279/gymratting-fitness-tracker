import React, { useState, useMemo } from 'react';
import { useFitness } from '../context/FitnessContext';
import { Exercise, ExerciseCategory } from '../types';
import { EXERCISE_CATEGORIES } from '../constants';
import { X, Plus, Search } from 'lucide-react';
import ExerciseFormModal from './ExerciseFormModal';

interface ExerciseSelectionModalProps {
    onSelect: (exerciseId: string) => void;
    onCancel: () => void;
}

const ExerciseSelectionModal: React.FC<ExerciseSelectionModalProps> = ({ onSelect, onCancel }) => {
    const { state, addExercise } = useFitness();
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<ExerciseCategory | 'ALL'>('ALL');
    const [isCreating, setIsCreating] = useState(false);

    const filteredExercises = useMemo(() => {
        return state.exercises.filter(ex => {
            const matchesFilter = filter === 'ALL' || ex.category === filter;
            const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesFilter && matchesSearch;
        });
    }, [state.exercises, searchTerm, filter]);

    const handleCreateExercise = async (data: Omit<Exercise, 'id' | 'user_id'>) => {
        const newExercise = await addExercise(data);
        if (newExercise) {
            setIsCreating(false);
            onSelect(newExercise.id);
        } else {
            alert("Failed to create exercise.");
        }
    }

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            {isCreating && 
                <ExerciseFormModal 
                    onSave={(data) => handleCreateExercise(data)}
                    onCancel={() => setIsCreating(false)} 
                />
            }
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-2xl font-bold">Select Exercise</h2>
                    <button onClick={onCancel} className="text-slate-400 hover:text-white"><X /></button>
                </div>
                <div className="mb-4 flex-shrink-0">
                    <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search exercises..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-700 border-slate-600 rounded-md p-2 pl-10 text-white placeholder-slate-400"
                        />
                    </div>
                     <div className="flex flex-wrap gap-2">
                        <button onClick={() => setFilter('ALL')} className={`px-3 py-1 text-sm rounded-full transition-colors ${filter === 'ALL' ? 'bg-electric-blue-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>All</button>
                        {EXERCISE_CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => setFilter(cat)} className={`px-3 py-1 text-sm rounded-full transition-colors ${filter === cat ? 'bg-electric-blue-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>{cat}</button>
                        ))}
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-2">
                    {filteredExercises.map(ex => (
                        <button key={ex.id} onClick={() => onSelect(ex.id)} className="w-full text-left p-3 bg-slate-900 rounded-lg hover:bg-slate-700 transition-colors">
                            <p className="font-semibold text-white">{ex.name}</p>
                            <p className="text-xs text-slate-400">{ex.category} - {ex.exerciseType}</p>
                        </button>
                    ))}
                </div>

                <div className="mt-4 flex-shrink-0">
                    <button onClick={() => setIsCreating(true)} className="w-full flex items-center justify-center py-2 px-4 bg-electric-blue-600 text-white font-bold rounded-lg hover:bg-electric-blue-500">
                        <Plus className="w-5 h-5 mr-2" /> Create New Exercise
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExerciseSelectionModal;
