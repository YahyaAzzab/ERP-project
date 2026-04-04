import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Building2, ShieldCheck, BarChart3, Boxes, Users } from 'lucide-react';

const Login = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const { login } = useAuth();
  const [loginError, setLoginError] = useState(null);

  const onSubmit = async (data) => {
    try {
      setLoginError(null);
      await login(data.email, data.password);
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Une erreur est survenue.';
      setLoginError(message);
      console.error('Erreur de connexion:', error);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#091a2a] flex items-center justify-center px-4 py-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 -left-16 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute top-20 right-0 h-96 w-96 rounded-full bg-teal-400/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-blue-300/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/15 bg-white/10 shadow-[0_25px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="relative p-7 sm:p-10 lg:p-12 text-white border-b border-white/10 lg:border-b-0 lg:border-r lg:border-r-white/10">
            <div className="inline-flex items-center gap-3 rounded-2xl bg-white/10 border border-white/20 px-4 py-2">
              <Building2 size={20} className="text-cyan-100" />
              <div className="leading-tight">
                <p className="text-3xl sm:text-4xl font-black tracking-[0.08em] text-white">ERP DOYA</p>
              </div>
            </div>

            <p className="mt-6 max-w-xl text-sm sm:text-base leading-7 text-white/75">
              Une seule interface pour piloter la comptabilite, les ressources humaines et les stocks, avec des donnees fiables et des processus fluides.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm flex items-center gap-2">
                <BarChart3 size={16} className="text-cyan-100" /> KPI en temps reel
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm flex items-center gap-2">
                <Boxes size={16} className="text-cyan-100" /> Stocks sous controle
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm flex items-center gap-2">
                <Users size={16} className="text-cyan-100" /> Acces par roles
              </div>
            </div>
          </section>

          <section className="bg-white/95 dark:bg-slate-900/95 p-7 sm:p-10 lg:p-12">
            <div className="mx-auto w-full max-w-md">
              <div className="lg:hidden mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-700 px-3 py-1.5 border border-blue-200">
                <Building2 size={14} /> ERP DOYA
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">Connexion</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Accedez a votre espace securise.</p>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1" htmlFor="email">
                    Email
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-300">
                      <Mail size={16} />
                    </span>
                    <input
                      id="email"
                      type="email"
                      {...register('email', { required: 'Email est requis' })}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="exemple@doya.com"
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1" htmlFor="password">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-300">
                      <Lock size={16} />
                    </span>
                    <input
                      id="password"
                      type="password"
                      {...register('password', { required: 'Mot de passe est requis' })}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="Votre mot de passe"
                    />
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                </div>

                {loginError && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-2.5">{loginError}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 disabled:opacity-60 text-white font-semibold py-2.5 transition"
                >
                  <ShieldCheck size={16} /> {isSubmitting ? 'Connexion...' : 'Se connecter'}
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Login;
