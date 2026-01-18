import React, { useState } from 'react';
import { Exercise, ExerciseCategory, ExerciseType } from '../types';
import { EXERCISE_CATEGORIES } from '../constants';
import { Save, X, Weight, Zap } from 'lucide-react';

interface ExerciseFormModalProps {
    exercise?: Exercise;
    onSave: (data: Omit<Exercise, 'user_id'>) => void;
    onCancel: () => void;
}

const ExerciseFormModal: React.FC<ExerciseFormModalProps> = ({ exercise, onSave, onCancel }) => {
    const [name, setName] = useState(exercise?.name || '');
    const [category, setCategory] = useState(exercise?.category || ExerciseCategory.CHEST);
    const [exerciseType, setExerciseType] = useState(exercise?.exerciseType || ExerciseType.STRENGTH);

    const handleSave = () => {
        if(name.trim()) {
            onSave({ 
                id: exercise?.id || '', // id will be empty for new exercises
                name: name.trim(), 
                category, 
                exerciseType 
            });
        }
    }

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg relative" onClick={e => e.stopPropagation()}>
                <button onClick={onCancel} className="absolute top-3 right-3 text-slate-400 hover:text-white"><X /></button>
                <h2 className="text-2xl font-bold mb-6 text-white">{exercise ? 'Edit' : 'Create'} Exercise</h2>
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
                    <button onClick={handleSave} className="px-4 py-2 bg-electric-blue-600 text-white font-bold rounded-lg hover:bg-electric-blue-500 flex items-center"><Save className="w-4 h-4 mr-2"/> {exercise ? 'Save Changes' : 'Create Exercise'}</button>
                </div>
            </div>
        </div>
    );
};

export default ExerciseFormModal;
