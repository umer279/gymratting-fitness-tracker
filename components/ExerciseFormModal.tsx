
import React, { useState } from 'react';
import { Exercise, ExerciseCategory, ExerciseType } from '../types';
import { EXERCISE_CATEGORIES } from '../constants';
import { Save, X, Weight, Zap } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ExerciseFormModalProps {
    exercise?: Exercise;
    onSave: (data: Omit<Exercise, 'user_id'>) => void;
    onCancel: () => void;
}

const ExerciseFormModal: React.FC<ExerciseFormModalProps> = ({ exercise, onSave, onCancel }) => {
    const { t, tCategory } = useLanguage();
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
                <h2 className="text-2xl font-bold mb-6 text-white">{exercise ? t('exercise_form_edit_title') : t('exercise_form_create_title')}</h2>
                <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">{t('exercise_name_label')}</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-700 p-2 rounded-md" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">{t('category_label')}</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value as ExerciseCategory)} className="w-full bg-slate-700 p-2 rounded-md">
                            {EXERCISE_CATEGORIES.map(cat => <option key={cat} value={cat}>{tCategory(cat)}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">{t('exercise_type_label')}</label>
                        <div className="flex rounded-lg bg-slate-900 p-1 w-full">
                            <button type="button" onClick={() => setExerciseType(ExerciseType.STRENGTH)} className={`flex-1 flex items-center justify-center p-2 rounded-md text-sm font-semibold transition-colors ${exerciseType === ExerciseType.STRENGTH ? 'bg-electric-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}><Weight className="w-4 h-4 mr-2" />{t('strength_type')}</button>
                            <button type="button" onClick={() => setExerciseType(ExerciseType.CARDIO)} className={`flex-1 flex items-center justify-center p-2 rounded-md text-sm font-semibold transition-colors ${exerciseType === ExerciseType.CARDIO ? 'bg-electric-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}><Zap className="w-4 h-4 mr-2" />{t('cardio_type')}</button>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                    <button onClick={onCancel} className="px-4 py-2 bg-slate-600 rounded-lg hover:bg-slate-500">{t('cancel_button')}</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-electric-blue-600 text-white font-bold rounded-lg hover:bg-electric-blue-500 flex items-center"><Save className="w-4 h-4 mr-2"/> {exercise ? t('exercise_form_save_button') : t('exercise_form_create_button')}</button>
                </div>
            </div>
        </div>
    );
};

export default ExerciseFormModal;