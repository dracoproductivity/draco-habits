import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export const ForgotPasswordForm = ({ onBack }: ForgotPasswordFormProps) => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: 'Erro',
        description: 'Digite seu email',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    const { error } = await resetPassword(email);
    
    setLoading(false);
    
    if (error) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível enviar o email',
        variant: 'destructive',
      });
      return;
    }

    setSent(true);
    toast({
      title: 'Email enviado!',
      description: 'Verifique sua caixa de entrada',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </button>

      {sent ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-fire flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Email enviado!</h3>
          <p className="text-muted-foreground text-sm">
            Enviamos um link de redefinição para seu email.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Digite seu email para receber um link de redefinição de senha.
          </p>
          
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-dark w-full pl-12"
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn-fire w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              'Enviar link'
            )}
          </button>
        </form>
      )}
    </motion.div>
  );
};
