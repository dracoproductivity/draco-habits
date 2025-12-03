import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { DracoIcon } from '@/components/icons/DracoIcon';

type AuthView = 'login' | 'signup' | 'forgot';

export const AuthPage = () => {
  const [view, setView] = useState<AuthView>('login');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 animate-float">
            <DracoIcon level={1} />
          </div>
          <h1 className="text-3xl font-bold text-gradient-fire mb-2">
            Draco Habits
          </h1>
          <p className="text-muted-foreground">
            Construa hábitos, evolua o Draco
          </p>
        </div>

        {/* Auth Card */}
        <div className="card-dark p-6">
          <AnimatePresence mode="wait">
            {view === 'login' && (
              <LoginForm
                key="login"
                onForgotPassword={() => setView('forgot')}
              />
            )}
            {view === 'signup' && <SignupForm key="signup" />}
            {view === 'forgot' && (
              <ForgotPasswordForm
                key="forgot"
                onBack={() => setView('login')}
              />
            )}
          </AnimatePresence>

          {/* Toggle auth mode */}
          {view !== 'forgot' && (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {view === 'login' ? 'Não tem conta?' : 'Já tem conta?'}
                <button
                  onClick={() => setView(view === 'login' ? 'signup' : 'login')}
                  className="ml-1 text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  {view === 'login' ? 'Criar conta' : 'Entrar'}
                </button>
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
