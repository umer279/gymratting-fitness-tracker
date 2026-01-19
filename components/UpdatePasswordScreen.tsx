
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../context/LanguageContext';

const UpdatePasswordScreen: React.FC = () => {
    const { t } = useLanguage();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError(t('update_password_mismatch_error'));
            return;
        }
        if (password.length < 6) {
            setError(t('update_password_length_error'));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            
            alert(t('update_password_success_alert'));
            await supabase.auth.signOut();
            // The onAuthStateChange listener will handle navigating back to the AuthScreen
        } catch (error: any) {
            setError(error.error_description || error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="flex flex-col items-center justify-center mb-8">
                    <img src="/logo.png" alt="Gymratting Logo" className="w-32 h-32 mb-4" />
                </div>
                <div className="bg-slate-800 rounded-lg shadow-xl p-8">
                    <h2 className="text-center text-xl font-bold mb-6 text-white">{t('update_password_title')}</h2>
                    <form onSubmit={handleUpdatePassword} className="space-y-6">
                        <div>
                            <label htmlFor="new-password"className="block text-sm font-medium text-slate-300">{t('update_password_new_label')}</label>
                            <input
                                id="new-password"
                                name="new-password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md p-3 text-white placeholder-slate-400 focus:ring-electric-blue-500 focus:border-electric-blue-500"
                            />
                        </div>
                         <div>
                            <label htmlFor="confirm-password"className="block text-sm font-medium text-slate-300">{t('update_password_confirm_label')}</label>
                            <input
                                id="confirm-password"
                                name="confirm-password"
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md p-3 text-white placeholder-slate-400 focus:ring-electric-blue-500 focus:border-electric-blue-500"
                            />
                        </div>

                        {error && <p className="text-sm text-red-400">{error}</p>}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 bg-electric-blue-600 text-white font-bold rounded-lg hover:bg-electric-blue-500 transition-colors disabled:opacity-50"
                            >
                                {loading ? t('auth_processing') : t('update_password_button')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UpdatePasswordScreen;
