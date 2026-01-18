
import React, { useMemo } from 'react';
import { useFitness } from '../context/FitnessContext';
import { ExerciseType, ExerciseCategory } from '../types';
import { BarChart, PieChart, Weight, Sparkles, Activity } from 'lucide-react';

interface AnalyticsScreenProps {
    onOpenAiAssistant: (prompt: string) => void;
}

const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ onOpenAiAssistant }) => {
    const { state } = useFitness();
    const isAiEnabled = (import.meta as any).env.VITE_GEMINI_API_KEY;

    const analytics = useMemo(() => {
        const { history, exercises } = state;

        if (history.length === 0) {
            return {
                totalWorkouts: 0,
                totalVolume: 0,
                avgDuration: 0,
                categoryDistribution: {},
                weeklyFrequency: {},
            };
        }

        const totalWorkouts = history.length;
        
        let totalVolume = 0;
        let totalDuration = 0;
        const categoryCounts: Record<string, number> = {};
        
        const weeklyFrequency: Record<string, number> = {};
        const today = new Date();
        const fourWeeksAgo = new Date(today);
        fourWeeksAgo.setDate(today.getDate() - 28);

        history.forEach(workout => {
            totalDuration += workout.duration;
            const workoutDate = new Date(workout.date);
            
            // Weekly Frequency
            if (workoutDate > fourWeeksAgo) {
                const weekStart = new Date(workoutDate);
                weekStart.setDate(workoutDate.getDate() - workoutDate.getDay());
                const weekKey = weekStart.toISOString().split('T')[0];
                weeklyFrequency[weekKey] = (weeklyFrequency[weekKey] || 0) + 1;
            }

            workout.exercises.forEach(performedEx => {
                const exerciseDetails = exercises.find(e => e.id === performedEx.exerciseId);
                if (exerciseDetails) {
                    // Category Distribution
                    categoryCounts[exerciseDetails.category] = (categoryCounts[exerciseDetails.category] || 0) + 1;
                    
                    // Total Volume
                    if (exerciseDetails.exerciseType === ExerciseType.STRENGTH && performedEx.sets) {
                        performedEx.sets.forEach(set => {
                            totalVolume += (set.weight || 0) * (set.reps || 0);
                        });
                    }
                }
            });
        });

        const avgDuration = totalWorkouts > 0 ? Math.round((totalDuration / totalWorkouts) / 60) : 0;
        
        return {
            totalWorkouts,
            totalVolume,
            avgDuration,
            categoryDistribution: categoryCounts,
            weeklyFrequency,
        };
    }, [state.history, state.exercises]);
    
    const sortedCategories = useMemo(() => {
        return Object.entries(analytics.categoryDistribution).sort(([, a], [, b]) => b - a);
    }, [analytics.categoryDistribution]);

    const handleAiAnalysis = () => {
        const prompt = `Please provide a detailed analysis of my workout data. Give me insights on my consistency, volume, muscle group balance, and suggest areas for improvement. Be encouraging but also direct about where I can do better.

My Analytics Data:
- Total Workouts: ${analytics.totalWorkouts}
- Total Volume Lifted: ${analytics.totalVolume.toLocaleString()} kg
- Average Workout Duration: ${analytics.avgDuration} minutes
- Muscle Group Focus (by exercises logged): ${JSON.stringify(analytics.categoryDistribution)}
- Recent Weekly Workouts (last 4 weeks): ${JSON.stringify(analytics.weeklyFrequency)}
`;
        onOpenAiAssistant(prompt);
    };
    
    if (state.history.length === 0) {
        return (
            <div className="p-4 md:p-8 text-center">
                <h1 className="text-3xl md:text-4xl font-bold mb-6">Workout Analytics</h1>
                <div className="py-10 px-6 bg-slate-800 rounded-lg border-2 border-dashed border-slate-700">
                    <p className="text-slate-400">Not enough data to display analytics. Complete a few workouts to see your progress here!</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl md:text-4xl font-bold">Workout Analytics</h1>
                 {isAiEnabled && (
                    <button onClick={handleAiAnalysis} className="flex items-center justify-center py-2 px-4 bg-electric-blue-600 text-white font-bold rounded-lg hover:bg-electric-blue-500 transition-colors">
                        <Sparkles className="w-5 h-5 mr-2" /> Get AI Analysis
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                    <div className="flex items-center text-slate-400 mb-2">
                        <Activity size={16} className="mr-2"/>
                        <h3 className="text-sm font-semibold">Total Workouts</h3>
                    </div>
                    <p className="text-4xl font-bold text-white">{analytics.totalWorkouts}</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                    <div className="flex items-center text-slate-400 mb-2">
                        <Weight size={16} className="mr-2"/>
                        <h3 className="text-sm font-semibold">Total Volume</h3>
                    </div>
                    <p className="text-4xl font-bold text-white">{analytics.totalVolume.toLocaleString()}<span className="text-xl text-slate-400"> kg</span></p>
                </div>
                 <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                    <div className="flex items-center text-slate-400 mb-2">
                        <BarChart size={16} className="mr-2"/>
                        <h3 className="text-sm font-semibold">Avg. Duration</h3>
                    </div>
                    <p className="text-4xl font-bold text-white">{analytics.avgDuration}<span className="text-xl text-slate-400"> min</span></p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                    <h3 className="text-xl font-bold mb-4 flex items-center"><BarChart size={20} className="mr-3 text-electric-blue-400"/>Workout Frequency</h3>
                    <p className="text-sm text-slate-400 mb-4">Workouts logged in the last 4 weeks.</p>
                    <div className="space-y-2">
                       {Object.entries(analytics.weeklyFrequency).map(([week, count]) => {
                           const maxCount = Math.max(...Object.values(analytics.weeklyFrequency));
                           const percentage = (count / maxCount) * 100;
                           return (
                               <div key={week} className="flex items-center">
                                   <span className="text-xs text-slate-400 w-24">{new Date(week).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                   <div className="flex-1 bg-slate-700 rounded-full h-6 mr-2">
                                       <div className="bg-electric-blue-600 h-6 rounded-full text-right pr-2 text-white text-xs leading-6" style={{ width: `${percentage}%` }}></div>
                                   </div>
                                   <span className="font-bold w-4">{count}</span>
                               </div>
                           )
                       })}
                    </div>
                </div>

                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                    <h3 className="text-xl font-bold mb-4 flex items-center"><PieChart size={20} className="mr-3 text-electric-blue-400"/>Muscle Group Distribution</h3>
                     <p className="text-sm text-slate-400 mb-4">Breakdown by number of exercises performed.</p>
                    <div className="space-y-3">
                        {sortedCategories.map(([category, count]) => {
                           const totalExercises = Object.values(analytics.categoryDistribution).reduce((a,b)=>a+b, 0);
                           const percentage = totalExercises > 0 ? (count / totalExercises) * 100 : 0;
                            return (
                                <div key={category}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-semibold text-slate-300">{category}</span>
                                        <span className="text-slate-400">{Math.round(percentage)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-700 rounded-full h-2.5">
                                        <div className="bg-electric-blue-500 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsScreen;
