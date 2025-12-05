import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette, 
  Bell, 
  User, 
  Info, 
  ChevronRight,
  LogOut,
  Trash2,
  Check,
  BarChart3,
  Circle,
  Plus,
  X,
  Clock,
  Moon,
  Camera,
  Save,
  Calendar
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ThemeColor, ProgressDisplayMode, NotificationReminder, DracoState } from '@/types';
import { DracoIcon } from '@/components/icons/DracoIcon';
import { XPBar } from '@/components/ui/XPBar';
import { format, differenceInYears, parse } from 'date-fns';

const THEME_OPTIONS: { id: ThemeColor; name: string; color: string }[] = [
  { id: 'blue', name: 'Azul', color: '200 90% 50%' },
  { id: 'green', name: 'Verde', color: '160 80% 45%' },
  { id: 'yellow', name: 'Amarelo', color: '45 95% 55%' },
  { id: 'neutral', name: 'Neutro', color: '0 0% 70%' },
  { id: 'red', name: 'Vermelho', color: '0 80% 55%' },
  { id: 'purple', name: 'Roxo', color: '270 80% 60%' },
  { id: 'pink', name: 'Rosa', color: '350 80% 55%' },
  { id: 'orange', name: 'Laranja', color: '25 95% 55%' },
  { id: 'lilac', name: 'Lilás', color: '280 65% 70%' },
  { id: 'gray', name: 'Cinza', color: '220 15% 55%' },
  { id: 'mint', name: 'Menta', color: '170 70% 50%' },
];

const DRACO_COLORS: { id: DracoState['color']; name: string; color: string }[] = [
  { id: 'blue', name: 'Azul', color: '200 90% 50%' },
  { id: 'green', name: 'Verde', color: '160 80% 45%' },
  { id: 'yellow', name: 'Amarelo', color: '45 95% 55%' },
  { id: 'neutral', name: 'Branco/Preto', color: '0 0% 70%' },
  { id: 'red', name: 'Vermelho', color: '0 80% 55%' },
  { id: 'purple', name: 'Roxo', color: '270 80% 60%' },
  { id: 'pink', name: 'Rosa', color: '350 80% 55%' },
  { id: 'orange', name: 'Laranja', color: '25 95% 55%' },
  { id: 'lilac', name: 'Lilás', color: '280 65% 70%' },
  { id: 'gray', name: 'Cinza', color: '220 15% 55%' },
  { id: 'mint', name: 'Menta', color: '170 70% 50%' },
];

const PROGRESS_DISPLAY_OPTIONS: { id: ProgressDisplayMode; name: string; icon: typeof BarChart3 }[] = [
  { id: 'linear', name: 'Linear', icon: BarChart3 },
  { id: 'circular', name: 'Circular', icon: Circle },
];

const FRIENDLY_MESSAGES = [
  'Ei, campeão! 🏆 Hora de brilhar nos seus hábitos!',
  'Bora lá! 💪 Seus hábitos estão te esperando!',
  'Opa! 🌟 Que tal dar uma olhada nos seus objetivos?',
  'Psiu! 🎯 Não esquece dos hábitos de hoje!',
  'Hey! 🚀 Vamos conquistar mais um dia juntos?',
  'E aí! 🌈 Seus hábitos estão com saudade de você!',
  'Alô! 🎉 Hora de fazer acontecer!',
  'Atenção! 🔔 O sucesso está te chamando!',
];

export const SettingsPage = () => {
  const { settings, updateSettings, logout, user, updateUser, draco, updateDraco } = useAppStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminderTime, setNewReminderTime] = useState('09:00');
  
  // Profile state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [birthDate, setBirthDate] = useState(user?.birthDate || '');
  const [photoPreview, setPhotoPreview] = useState(user?.photo || '');
  const [dracoName, setDracoName] = useState(draco.name || 'Draco');
  const [dracoNameError, setDracoNameError] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.themeColor);
    document.documentElement.classList.toggle('dark', settings.darkMode);
  }, [settings.themeColor, settings.darkMode]);

  const calculateAge = (birthDateStr: string): number => {
    if (!birthDateStr) return 0;
    try {
      const birth = new Date(birthDateStr);
      return differenceInYears(new Date(), birth);
    } catch {
      return 0;
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: 'Até logo!',
      description: 'Você foi desconectado',
    });
  };

  const handleDeleteAccount = () => {
    logout();
    toast({
      title: 'Conta excluída',
      description: 'Sua conta foi removida',
    });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhotoPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDracoNameChange = (value: string) => {
    // Only allow letters and spaces
    const sanitized = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '').slice(0, 32);
    setDracoName(sanitized);
    
    if (value !== sanitized && value.length > 0) {
      setDracoNameError('Apenas letras são permitidas');
    } else if (sanitized.length >= 32) {
      setDracoNameError('Máximo de 32 caracteres');
    } else {
      setDracoNameError('');
    }
  };

  const handleSaveProfile = () => {
    updateUser({
      firstName,
      lastName,
      birthDate,
      photo: photoPreview,
    });
    updateDraco({ name: dracoName });
    toast({
      title: 'Perfil atualizado!',
      description: 'Suas informações foram salvas',
    });
  };

  const addReminder = () => {
    const randomMessage = FRIENDLY_MESSAGES[Math.floor(Math.random() * FRIENDLY_MESSAGES.length)];
    const newReminder: NotificationReminder = {
      id: Date.now().toString(),
      time: newReminderTime,
      message: randomMessage,
      enabled: true,
    };
    updateSettings({
      notificationReminders: [...(settings.notificationReminders || []), newReminder],
    });
    setShowAddReminder(false);
    setNewReminderTime('09:00');
    toast({
      title: 'Lembrete adicionado! 🎉',
      description: `Você será lembrado às ${newReminderTime}`,
    });
  };

  const removeReminder = (id: string) => {
    updateSettings({
      notificationReminders: settings.notificationReminders?.filter((r) => r.id !== id) || [],
    });
    toast({
      title: 'Lembrete removido',
      description: 'O lembrete foi excluído',
    });
  };

  const toggleReminder = (id: string) => {
    updateSettings({
      notificationReminders: settings.notificationReminders?.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      ) || [],
    });
  };

  const updateReminderMessage = (id: string, message: string) => {
    updateSettings({
      notificationReminders: settings.notificationReminders?.map((r) =>
        r.id === id ? { ...r, message } : r
      ) || [],
    });
  };

  const age = calculateAge(birthDate);

  // Check for desktop
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen p-4 ${isDesktop ? 'pb-8 pt-6' : 'pb-20'}`}
    >
      <header className="mb-6">
        <h1 className={`font-bold text-gradient-primary ${isDesktop ? 'text-3xl' : 'text-2xl'}`}>Configurações</h1>
        <p className="text-muted-foreground">Personalize sua experiência</p>
      </header>

      <div className="space-y-4">
        {/* Profile Section */}
        <section className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <User className="w-5 h-5 text-primary-foreground" />
            </div>
            <h2 className="font-semibold text-foreground">Perfil</h2>
          </div>

          {/* Draco Stats */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/30 mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 animate-float">
                <DracoIcon level={draco.level} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">{dracoName} - Nível {draco.level}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {draco.totalXP} XP total
                </p>
                <XPBar
                  currentXP={draco.currentXP}
                  xpToNextLevel={draco.xpToNextLevel}
                  level={draco.level}
                />
              </div>
            </div>
          </div>

          {/* Photo */}
          <div className="flex flex-col items-center mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-4 border-primary/30">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-7 h-7 rounded-full gradient-fire flex items-center justify-center cursor-pointer">
                <Camera className="w-3.5 h-3.5 text-primary-foreground" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Form fields */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Nome</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input-dark w-full text-sm py-2"
                  placeholder="Seu nome"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Sobrenome</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input-dark w-full text-sm py-2"
                  placeholder="Seu sobrenome"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                Data de Nascimento {age > 0 && <span className="text-primary">({age} anos)</span>}
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="input-dark w-full text-sm py-2"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Nome do seu Draco</label>
              <input
                type="text"
                value={dracoName}
                onChange={(e) => handleDracoNameChange(e.target.value)}
                className="input-dark w-full text-sm py-2"
                placeholder="Nome do Draco"
                maxLength={32}
              />
              {dracoNameError && (
                <p className="text-xs text-destructive">{dracoNameError}</p>
              )}
              <p className="text-xs text-muted-foreground">{dracoName.length}/32 caracteres</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Cor do Draco</label>
              <div className="grid grid-cols-6 gap-2">
                {DRACO_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => updateDraco({ color: color.id })}
                    className={cn(
                      'relative flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all',
                      draco.color === color.id 
                        ? 'border-primary bg-primary/10' 
                        : 'border-transparent bg-muted/30 hover:bg-muted/50'
                    )}
                  >
                    <div 
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: `hsl(${color.color})` }}
                    />
                    {draco.color === color.id && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleSaveProfile} className="btn-fire w-full flex items-center justify-center gap-2 py-2">
              <Save className="w-4 h-4" />
              Salvar perfil
            </button>
          </div>
        </section>

        {/* Theme */}
        <section className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Palette className="w-5 h-5 text-primary-foreground" />
            </div>
            <h2 className="font-semibold text-foreground">Tema</h2>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-3">Escolha sua cor</p>
              <div className="grid grid-cols-5 gap-2">
                {THEME_OPTIONS.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => updateSettings({ themeColor: theme.id })}
                    className={cn(
                      'relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                      settings.themeColor === theme.id 
                        ? 'border-primary bg-primary/10' 
                        : 'border-transparent bg-muted/30 hover:bg-muted/50'
                    )}
                  >
                    <div 
                      className="w-8 h-8 rounded-full"
                      style={{ 
                        backgroundColor: `hsl(${theme.color})` 
                      }}
                    />
                    <span className="text-[10px] text-foreground">{theme.name}</span>
                    {settings.themeColor === theme.id && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-border/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Moon className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Modo Noturno</p>
                    <p className="text-sm text-muted-foreground">Ativar tema escuro</p>
                  </div>
                </div>
                <button
                  onClick={() => updateSettings({ darkMode: !settings.darkMode })}
                  className={cn(
                    'w-12 h-6 rounded-full transition-all duration-300 relative',
                    settings.darkMode ? 'bg-primary' : 'bg-muted'
                  )}
                >
                  <div
                    className={cn(
                      'absolute top-1 w-4 h-4 rounded-full bg-foreground transition-all duration-300',
                      settings.darkMode ? 'right-1' : 'left-1'
                    )}
                  />
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-border/30">
              <p className="text-sm text-muted-foreground mb-3">Exibição do progresso</p>
              <div className="grid grid-cols-2 gap-2">
                {PROGRESS_DISPLAY_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => updateSettings({ progressDisplayMode: option.id })}
                    className={cn(
                      'flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all',
                      settings.progressDisplayMode === option.id 
                        ? 'border-primary bg-primary/10' 
                        : 'border-transparent bg-muted/30 hover:bg-muted/50'
                    )}
                  >
                    <option.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{option.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="font-medium text-foreground">Mostrar emojis</p>
                <p className="text-sm text-muted-foreground">Exibir emojis nos hábitos</p>
              </div>
              <button
                onClick={() => updateSettings({ showEmojis: !settings.showEmojis })}
                className={cn(
                  'w-12 h-6 rounded-full transition-all duration-300 relative',
                  settings.showEmojis ? 'bg-primary' : 'bg-muted'
                )}
              >
                <div
                  className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-foreground transition-all duration-300',
                    settings.showEmojis ? 'right-1' : 'left-1'
                  )}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary-foreground" />
            </div>
            <h2 className="font-semibold text-foreground">Notificações</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Lembretes diários</p>
                <p className="text-sm text-muted-foreground">Receba lembretes para preencher hábitos</p>
              </div>
              <button
                onClick={() => updateSettings({ notificationsEnabled: !settings.notificationsEnabled })}
                className={cn(
                  'w-12 h-6 rounded-full transition-all duration-300 relative',
                  settings.notificationsEnabled ? 'bg-primary' : 'bg-muted'
                )}
              >
                <div
                  className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-foreground transition-all duration-300',
                    settings.notificationsEnabled ? 'right-1' : 'left-1'
                  )}
                />
              </button>
            </div>

            <AnimatePresence>
              {settings.notificationsEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <p className="text-sm text-muted-foreground">Seus lembretes:</p>
                  
                  <div className="space-y-2">
                    {(settings.notificationReminders || []).map((reminder) => (
                      <motion.div
                        key={reminder.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={cn(
                          'p-3 rounded-xl border transition-all',
                          reminder.enabled 
                            ? 'bg-primary/10 border-primary/30' 
                            : 'bg-muted/30 border-border/30 opacity-60'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary" />
                            <span className="font-semibold text-foreground">{reminder.time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleReminder(reminder.id)}
                              className={cn(
                                'w-8 h-5 rounded-full transition-all relative',
                                reminder.enabled ? 'bg-primary' : 'bg-muted'
                              )}
                            >
                              <div
                                className={cn(
                                  'absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-all',
                                  reminder.enabled ? 'right-0.5' : 'left-0.5'
                                )}
                              />
                            </button>
                            <button
                              onClick={() => removeReminder(reminder.id)}
                              className="p-1 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={reminder.message}
                          onChange={(e) => updateReminderMessage(reminder.id, e.target.value)}
                          className="mt-2 w-full bg-transparent text-sm text-muted-foreground border-none outline-none placeholder:text-muted-foreground/50"
                          placeholder="Mensagem do lembrete..."
                        />
                      </motion.div>
                    ))}
                  </div>

                  <AnimatePresence>
                    {showAddReminder ? (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">Novo lembrete</p>
                          <button
                            onClick={() => setShowAddReminder(false)}
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="time"
                            value={newReminderTime}
                            onChange={(e) => setNewReminderTime(e.target.value)}
                            className="flex-1 bg-muted/50 border border-border/50 rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                          />
                          <button
                            onClick={addReminder}
                            className="px-4 py-2 gradient-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
                          >
                            Adicionar
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          💡 A mensagem será gerada automaticamente de forma divertida!
                        </p>
                      </motion.div>
                    ) : (
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => setShowAddReminder(true)}
                        className="w-full py-3 flex items-center justify-center gap-2 border-2 border-dashed border-border/50 rounded-xl text-muted-foreground hover:border-primary/50 hover:text-primary transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Adicionar lembrete</span>
                      </motion.button>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Account */}
        <section className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <User className="w-5 h-5 text-primary-foreground" />
            </div>
            <h2 className="font-semibold text-foreground">Conta</h2>
          </div>

          <div className="space-y-1">
            <div className="py-2 px-1">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium text-foreground">{user?.email || 'usuario@email.com'}</p>
            </div>

            <button className="w-full py-3 flex items-center justify-between text-left hover:bg-muted/30 rounded-xl transition-colors px-3">
              <span className="text-foreground">Alterar senha</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <button
              onClick={handleLogout}
              className="w-full py-3 flex items-center gap-3 text-left hover:bg-muted/30 rounded-xl transition-colors px-3"
            >
              <LogOut className="w-5 h-5 text-foreground" />
              <span className="text-foreground">Sair da conta</span>
            </button>

            {showDeleteConfirm ? (
              <div className="p-3 border border-destructive/50 rounded-xl space-y-3 bg-destructive/5">
                <p className="text-sm text-destructive">
                  Tem certeza? Esta ação não pode ser desfeita.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2 bg-muted/50 text-foreground rounded-xl text-sm font-medium hover:bg-muted transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex-1 py-2 bg-destructive text-destructive-foreground rounded-xl text-sm font-medium"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-3 flex items-center gap-3 text-left text-destructive hover:bg-destructive/10 rounded-xl transition-colors px-3"
              >
                <Trash2 className="w-5 h-5" />
                <span>Excluir conta</span>
              </button>
            )}
          </div>
        </section>

        {/* About */}
        <section className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Info className="w-5 h-5 text-primary-foreground" />
            </div>
            <h2 className="font-semibold text-foreground">Sobre</h2>
          </div>

          <div className="space-y-1">
            <div className="py-2 px-1 flex items-center justify-between">
              <span className="text-foreground">Versão</span>
              <span className="text-muted-foreground">1.0.0</span>
            </div>

            <button className="w-full py-3 flex items-center justify-between text-left hover:bg-muted/30 rounded-xl transition-colors px-3">
              <span className="text-foreground">Termos de uso</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <button className="w-full py-3 flex items-center justify-between text-left hover:bg-muted/30 rounded-xl transition-colors px-3">
              <span className="text-foreground">Política de privacidade</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </section>
      </div>
    </motion.div>
  );
};
