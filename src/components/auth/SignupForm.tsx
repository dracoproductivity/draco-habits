import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { toast } from '@/hooks/use-toast';

export const SignupForm = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signup } = useAppStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName || !email || !password || !confirmPassword) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter pelo menos 6 caracteres',
        variant: 'destructive',
      });
      return;
    }

    const success = signup({
      email,
      firstName,
      lastName,
      photo: '',
    }, password);

    if (success) {
      toast({
        title: 'Conta criada!',
        description: 'Bem-vindo ao Draco Habits',
      });
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Nome"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="input-dark w-full pl-12"
          />
        </div>
        <input
          type="text"
          placeholder="Sobrenome"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="input-dark w-full"
        />
      </div>

      <div className="relative">
        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-dark w-full pl-12"
        />
      </div>

      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-dark w-full pl-12 pr-12"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>

      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Confirmar senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="input-dark w-full pl-12"
        />
      </div>

      <button type="submit" className="btn-fire w-full">
        Criar conta
      </button>
    </motion.form>
  );
};
