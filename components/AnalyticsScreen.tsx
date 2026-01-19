import React, { useMemo, useState } from 'react';
import { useFitness } from '../context/FitnessContext';
import { ExerciseType, ExerciseCategory, Exercise } from '../types';
import { BarChart, PieChart, Sparkles, Activity, Lock, Trophy, TrendingUp, Zap, Clock, Repeat } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface AnalyticsScreenProps {
    onOpenAiAssistant: (prompt: string) => void;
}

interface PersonalRecord {
    exerciseId: string;
    exerciseName: string;
    maxWeight: number;
    date: string;
    e1RM: number;
}

interface CardioBest {
    exerciseId: string;
    exerciseName: string;
    longestDuration: { value: number; date: string };
    maxDistance: { value: number; date: string };
}

interface AnalyticsData {
    totalWorkouts: number;
    totalSets: number;
    workoutDensity: number;
    categorySetsDistribution: Record<string, number>;
    weeklyFrequency: Record<string, number>; // Always last 4 weeks, independent of filter
    personalRecords: PersonalRecord[];
    cardioBests: CardioBest[];
}

type TimeFilter = 'all' | 'month' | 'week' | 'day';

const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ onOpenAiAssistant }) => {
    const { state } = useFitness();
    const { t, tCategory } = useLanguage();
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
    const isAiEnabled = (import.meta as any).env.VITE_GEMINI_API_KEY;

    const filteredHistory = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (timeFilter) {
            case 'day':
                return state.history.filter(h => new Date(h.date) >= startOfToday);
            case 'week':
                const firstDayOfWeek = new Date(startOfToday);
                firstDayOfWeek.setDate(startOfToday.getDate() - now.getDay());
                return state.history.filter(h => new Date(h.date) >= firstDayOfWeek);
            case 'month':
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                return state.history.filter(h => new Date(h.date) >= startOfMonth);
            case 'all':
            default:
                return state.history;
        }
    }, [state.history, timeFilter]);

    const analytics: AnalyticsData = useMemo(() => {
        const history = filteredHistory;
        const { exercises } = state;

        if (history.length === 0) {
            return {
                totalWorkouts: 0,
                totalSets: 0,
                workoutDensity: 0,
                categorySetsDistribution: {},
                weeklyFrequency: {},
                personalRecords: [],
                cardioBests: [],
            };
        }
        
        let totalVolume = 0;
        let totalSets = 0;
        const totalDuration = history.reduce((acc, workout) => acc + workout.duration, 0);
        
        const categorySets: Record<string, number> = {};
        const exercisePerformance: Record<string, { volume: number; count: number; maxWeightSet: { weight: number; reps: number; date: string } }> = {};
        const cardioPerformance: Record<string, { count: number; longestDuration: { value: number; date: string }; maxDistance: { value: number; date: string } }> = {};
        
        history.forEach(workout => {
            workout.exercises.forEach(performedEx => {
                const exerciseDetails = exercises.find(e => e.id === performedEx.exerciseId);
                if (!exerciseDetails) return;

                if (exerciseDetails.exerciseType === ExerciseType.STRENGTH && performedEx.sets) {
                    const workingSets = performedEx.sets.filter(set => !set.isWarmup);
                    
                    if (workingSets.length > 0) {
                        totalSets += workingSets.length;
                        categorySets[exerciseDetails.category] = (categorySets[exerciseDetails.category] || 0) + workingSets.length;
                
                        let sessionVolume = 0;
                        let sessionMaxWeightSet = { weight: 0, reps: 0 };
                
                        workingSets.forEach(set => {
                            const weight = set.weight || 0;
                            const reps = set.reps || 0;
                            sessionVolume += weight * reps;
                            if (weight > sessionMaxWeightSet.weight) {
                                sessionMaxWeightSet = { weight, reps };
                            }
                        });
                
                        totalVolume += sessionVolume;
                
                        const current = exercisePerformance[exerciseDetails.id] || { volume: 0, count: 0, maxWeightSet: { weight: 0, reps: 0, date: '' } };
                        const newMaxWeightSet = sessionMaxWeightSet.weight > current.maxWeightSet.weight ? { ...sessionMaxWeightSet, date: workout.date } : current.maxWeightSet;
                        
                        exercisePerformance[exerciseDetails.id] = {
                            volume: current.volume + sessionVolume,
                            count: current.count + 1,
                            maxWeightSet: newMaxWeightSet,
                        };
                    }
                } else if (exerciseDetails.exerciseType === ExerciseType.CARDIO && performedEx.cardioPerformance) {
                    const { duration, distance } = performedEx.cardioPerformance;
                    const current = cardioPerformance[exerciseDetails.id] || { count: 0, longestDuration: { value: 0, date: '' }, maxDistance: { value: 0, date: '' } };
                    cardioPerformance[exerciseDetails.id] = {
                        count: current.count + 1,
                        longestDuration: duration > current.longestDuration.value ? { value: duration, date: workout.date } : current.longestDuration,
                        maxDistance: (distance || 0) > current.maxDistance.value ? { value: distance || 0, date: workout.date } : current.maxDistance,
                    };
                }
            });
        });

        // Calculate PRs
        const personalRecords = Object.entries(exercisePerformance)
            .map(([exerciseId, data]) => {
                const { weight, reps } = data.maxWeightSet;
                const e1RM = weight > 0 && reps > 0 ? Math.round(weight * (1 + reps / 30)) : 0;
                return { exerciseId, exerciseName: exercises.find(e => e.id === exerciseId)?.name || 'Unknown', maxWeight: weight, date: new Date(data.maxWeightSet.date).toLocaleDateString(), e1RM };
            })
            .filter(pr => pr.maxWeight > 0)
            .sort((a,b) => b.e1RM - a.e1RM)
            .slice(0, 3);
        
        // Calculate Cardio Bests
        const topCardioExercises = Object.entries(cardioPerformance).sort(([, a], [, b]) => b.count - a.count).slice(0, 2);
        const cardioBests = topCardioExercises.map(([exerciseId, data]) => ({ exerciseId, exerciseName: exercises.find(e => e.id === exerciseId)?.name || 'Unknown', ...data }));

        // Weekly Frequency (always last 4 weeks, independent of filter)
        const weeklyFrequency: Record<string, number> = {};
        const fourWeeksAgo = new Date(new Date().setDate(new Date().getDate() - 28));
        state.history.filter(h => new Date(h.date) > fourWeeksAgo).forEach(workout => {
            const weekStart = new Date(workout.date);
            weekStart.setDate(new Date(workout.date).getDate() - new Date(workout.date).getDay());
            const weekKey = weekStart.toISOString().split('T')[0];
            weeklyFrequency[weekKey] = (weeklyFrequency[weekKey] || 0) + 1;
        });

        return {
            totalWorkouts: history.length,
            totalSets: totalSets,
            workoutDensity: totalDuration > 0 ? Math.round(totalVolume / (totalDuration / 60)) : 0,
            categorySetsDistribution: categorySets,
            weeklyFrequency,
            personalRecords,
            cardioBests,
        };
    }, [filteredHistory, state.exercises, state.history]);

    const handleAiAnalysis = () => {
        const translatedCategoryDistribution = Object.entries(analytics.categorySetsDistribution).reduce((acc, [key, value]) => {
            acc[tCategory(key as ExerciseCategory)] = value;
            return acc;
        }, {} as Record<string, number>);

        const prSummary = analytics.personalRecords.length > 0 
            ? analytics.personalRecords.map(pr => `${pr.exerciseName}: ${pr.maxWeight}kg (Est. 1RM: ${pr.e1RM}kg)`).join(', ')
            : 'N/A';
        
        const prompt = t('ai_analysis_prompt_v3', {
            timePeriod: t(`filter_${timeFilter}`),
            totalWorkouts: analytics.totalWorkouts,
            totalSets: analytics.totalSets,
            categorySetsDistribution: JSON.stringify(translatedCategoryDistribution),
            personalRecords: prSummary,
        });
        onOpenAiAssistant(prompt);
    };
    
    const renderAiAnalysisButton = () => {
        if (!isAiEnabled) return null;
        if (state.profile?.is_pro) {
            return (<button onClick={handleAiAnalysis} className="flex items-center justify-center py-2 px-4 bg-electric-blue-600 text-white font-bold rounded-lg hover:bg-electric-blue-500 transition-colors"><Sparkles className="w-5 h-5 mr-2" /> {t('get_ai_analysis_button')}</button>)
        }
        return (<div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-center"><div className="flex items-center justify-center mb-2"><Lock className="w-5 h-5 mr-2 text-electric-blue-400"/><h3 className="font-bold text-white">{t('premium_feature_title')}</h3></div><p className="text-sm text-slate-400">{t('premium_feature_description')}</p></div>)
    }
    
    const filterButtons: {key: TimeFilter, label: string}[] = [
        { key: 'all', label: t('filter_all_time')},
        { key: 'month', label: t('filter_month')},
        { key: 'week', label: t('filter_week')},
        { key: 'day', label: t('filter_day')},
    ]

    return (
        <div className="p-4 md:p-8 pb-32 md:pb-24 space-y-8">
            <div className="flex justify-between items-start"><h1 className="text-3xl md:text-4xl font-bold">{t('analytics_title')}</h1></div>
            
            <div className="flex flex-wrap gap-2">
                {filterButtons.map(btn => (
                    <button key={btn.key} onClick={() => setTimeFilter(btn.key)} className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${timeFilter === btn.key ? 'bg-electric-blue-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>{btn.label}</button>
                ))}
            </div>
            
            {filteredHistory.length === 0 ? (
                 <div className="text-center py-10 px-6 bg-slate-800 rounded-lg border-2 border-dashed border-slate-700"><p className="text-slate-400">{t('no_analytics_data')}</p></div>
            ) : (
            <>
                {renderAiAnalysisButton()}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700"><div className="flex items-center text-slate-400 mb-2"><Activity size={16} className="mr-2"/><h3 className="text-sm font-semibold">{t('total_workouts_label')}</h3></div><p className="text-4xl font-bold text-white">{analytics.totalWorkouts}</p></div>
                    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700"><div className="flex items-center text-slate-400 mb-2"><Repeat size={16} className="mr-2"/><h3 className="text-sm font-semibold">{t('total_sets_label')}</h3></div><p className="text-4xl font-bold text-white">{analytics.totalSets.toLocaleString()}</p></div>
                    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700"><div className="flex items-center text-slate-400 mb-2"><TrendingUp size={16} className="mr-2"/><h3 className="text-sm font-semibold">{t('workout_density_label')}</h3></div><p className="text-4xl font-bold text-white">{analytics.workoutDensity}<span className="text-xl text-slate-400"> kg/min</span></p></div>
                </div>

                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                    <h3 className="text-xl font-bold mb-4 flex items-center"><Trophy size={20} className="mr-3 text-yellow-400"/>{t('analytics_pr_title')}</h3>
                    <p className="text-sm text-slate-400 mb-4">{t('analytics_pr_subtitle')}</p>
                    {analytics.personalRecords.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {analytics.personalRecords.map(pr => (
                                <div key={pr.exerciseId} className="bg-slate-900 p-4 rounded-lg">
                                    <p className="font-bold text-white truncate">{pr.exerciseName}</p>
                                    <p className="text-2xl font-bold text-electric-blue-400">{pr.maxWeight} kg</p>
                                    <p className="text-xs text-yellow-400 font-bold">{t('e1rm_label')}: {pr.e1RM} kg</p>
                                    <p className="text-xs text-slate-500 mt-1">{t('lifted_on', { date: pr.date })}</p>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-slate-500 text-sm">{t('no_prs_yet')}</p>}
                </div>

                {analytics.cardioBests.length > 0 && (
                    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                        <h3 className="text-xl font-bold mb-4 flex items-center"><Zap size={20} className="mr-3 text-green-400"/>{t('analytics_cardio_bests_title')}</h3>
                        <p className="text-sm text-slate-400 mb-4">{t('analytics_cardio_bests_subtitle')}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {analytics.cardioBests.map(cb => (
                                <div key={cb.exerciseId} className="bg-slate-900 p-4 rounded-lg">
                                    <p className="font-bold text-white truncate">{cb.exerciseName}</p>
                                    <div className="mt-2 space-y-2 text-sm">
                                        <div className="flex items-center justify-between"><span className="flex items-center text-slate-300"><Clock size={14} className="mr-2"/>{t('longest_duration_label')}</span> <span className="font-mono text-green-400">{Math.floor(cb.longestDuration.value/60)}m {cb.longestDuration.value%60}s</span></div>
                                        {cb.maxDistance.value > 0 && <div className="flex items-center justify-between"><span className="flex items-center text-slate-300"><TrendingUp size={14} className="mr-2"/>{t('farthest_distance_label')}</span> <span className="font-mono text-green-400">{cb.maxDistance.value} km</span></div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                        <h3 className="text-xl font-bold mb-4 flex items-center"><PieChart size={20} className="mr-3 text-electric-blue-400"/>{t('analytics_sets_distribution_title')}</h3>
                        <p className="text-sm text-slate-400 mb-4">{t('analytics_sets_distribution_subtitle')}</p>
                        <div className="space-y-3">
                            {Object.entries(analytics.categorySetsDistribution).sort(([, a], [, b]) => b - a).map(([category, count]) => {
                            const totalSets = Object.values(analytics.categorySetsDistribution).reduce((a,b)=>a+b, 0);
                            const percentage = totalSets > 0 ? (count / totalSets) * 100 : 0;
                                return (
                                    <div key={category}>
                                        <div className="flex justify-between text-sm mb-1"><span className="font-semibold text-slate-300">{tCategory(category as ExerciseCategory)}</span><span className="text-slate-400">{count} {t('sets_label')} ({Math.round(percentage)}%)</span></div>
                                        <div className="w-full bg-slate-700 rounded-full h-2.5"><div className="bg-electric-blue-500 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div></div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                        <h3 className="text-xl font-bold mb-4 flex items-center"><BarChart size={20} className="mr-3 text-electric-blue-400"/>{t('workout_frequency_title')}</h3>
                        <p className="text-sm text-slate-400 mb-4">{t('workout_frequency_subtitle')}</p>
                        <div className="space-y-2">
                        {Object.entries(analytics.weeklyFrequency).map(([week, count]) => {
                            const maxCount = Math.max(...Object.values(analytics.weeklyFrequency));
                            const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                            return (
                                <div key={week} className="flex items-center">
                                    <span className="text-xs text-slate-400 w-24">{new Date(week).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                    <div className="flex-1 bg-slate-700 rounded-full h-6 mr-2"><div className="bg-electric-blue-600 h-6 rounded-full text-right pr-2 text-white text-xs leading-6" style={{ width: `${percentage}%` }}></div></div>
                                    <span className="font-bold w-4">{count}</span>
                                </div>
                            )
                        })}
                        </div>
                    </div>
                </div>
            </>
            )}
        </div>
    );
};

export default AnalyticsScreen;