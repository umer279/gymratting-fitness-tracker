


import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../context/LanguageContext';

const AuthScreen: React.FC = () => {
    const { t } = useLanguage();
    const [view, setView] = useState<'login' | 'signup' | 'reset'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (view === 'login') {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setMessage(t('auth_signup_success'));
            }
        } catch (error: any) {
            setError(error.error_description || error.message);
        } finally {
            setLoading(false);
        }
    };
    
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);
    
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin,
            });
            if (error) throw error;
            setMessage(t('auth_reset_success'));
        } catch (error: any) {
             setError(error.error_description || error.message);
        } finally {
            setLoading(false);
        }
    };
    
    const renderForm = () => {
        if (view === 'reset') {
            return (
                <form onSubmit={handleResetPassword} className="space-y-6">
                    <p className="text-sm text-slate-300 text-center">{t('auth_reset_instructions')}</p>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-300">{t('auth_email_label')}</label>
                        <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md p-3 text-white placeholder-slate-400 focus:ring-electric-blue-500 focus:border-electric-blue-500" />
                    </div>
                     <div>
                        <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 bg-electric-blue-600 text-white font-bold rounded-lg hover:bg-electric-blue-500 transition-colors disabled:opacity-50">
                            {loading ? t('auth_processing') : t('auth_send_instructions_button')}
                        </button>
                    </div>
                </form>
            );
        }

        return (
            <form onSubmit={handleAuth} className="space-y-6">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-300">{t('auth_email_label')}</label>
                    <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md p-3 text-white placeholder-slate-400 focus:ring-electric-blue-500 focus:border-electric-blue-500" />
                </div>
                <div>
                    <label htmlFor="password"className="block text-sm font-medium text-slate-300">{t('auth_password_label')}</label>
                    <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md p-3 text-white placeholder-slate-400 focus:ring-electric-blue-500 focus:border-electric-blue-500" />
                </div>
                {view === 'login' && (
                    <div className="text-right">
                        <button type="button" onClick={() => { setView('reset'); setError(null); setMessage(null); }} className="text-sm font-medium text-electric-blue-400 hover:text-electric-blue-300">
                           {t('auth_forgot_password')}
                        </button>
                    </div>
                )}
                <div>
                    <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 bg-electric-blue-600 text-white font-bold rounded-lg hover:bg-electric-blue-500 transition-colors disabled:opacity-50">
                        {loading ? t('auth_processing') : (view === 'login' ? t('auth_login_tab') : t('auth_signup_tab'))}
                    </button>
                </div>
            </form>
        );
    }
    
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="flex flex-col items-center justify-center mb-8">
                    <img src="/logo.png" alt="Gymratting Logo" className="w-32 h-32 mb-4" />
                </div>

                <div className="bg-slate-800 rounded-lg shadow-xl p-8">
                    {view !== 'reset' ? (
                        <div className="flex border-b border-slate-700 mb-6">
                            <button onClick={() => setView('login')} className={`flex-1 py-2 font-semibold transition-colors ${view === 'login' ? 'text-electric-blue-400 border-b-2 border-electric-blue-400' : 'text-slate-400 hover:text-white'}`}>
                                {t('auth_login_tab')}
                            </button>
                            <button onClick={() => setView('signup')} className={`flex-1 py-2 font-semibold transition-colors ${view === 'signup' ? 'text-electric-blue-400 border-b-2 border-electric-blue-400' : 'text-slate-400 hover:text-white'}`}>
                                {t('auth_signup_tab')}
                            </button>
                        </div>
                    ) : (
                        <h2 className="text-center text-xl font-bold mb-4 text-white">{t('auth_reset_password_title')}</h2>
                    )}

                    {renderForm()}
                    
                    {error && <p className="mt-4 text-sm text-red-400 text-center">{error}</p>}
                    {message && <p className="mt-4 text-sm text-green-400 text-center">{message}</p>}
                    
                    {view === 'reset' && (
                        <div className="mt-6 text-center">
                            <button type="button" onClick={() => { setView('login'); setError(null); setMessage(null); }} className="text-sm font-medium text-electric-blue-400 hover:text-electric-blue-300">
                                {t('auth_back_to_login')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthScreen;