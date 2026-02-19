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
  Plus,
  X,
  Clock,
  Moon,
  Camera,
  Save,
  Calendar,
  Loader2,
  Flame
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/hooks/useAuth';
import { useCloudSync } from '@/hooks/useCloudSync';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ThemeColor, NotificationReminder, DracoState, HSLColor } from '@/types';
import { DracoIcon, DRACO_IMAGES } from '@/components/icons/DracoIcon';
import { XPBar } from '@/components/ui/XPBar';
import { Switch } from '@/components/ui/switch';
import { UniversalHeader } from '@/components/layout/UniversalHeader';
import { CategoriesSection } from '@/components/settings/CategoriesSection';
import { WallpaperSection } from '@/components/settings/WallpaperSection';
import { ColorWheelPicker } from '@/components/ui/ColorWheelPicker';
import { ImageCropper } from '@/components/ui/ImageCropper';
import { format, differenceInYears, parse } from 'date-fns';

const THEME_OPTIONS: { id: ThemeColor; name: string; color: string }[] = [
  { id: 'blue', name: 'Azul', color: '200 90% 50%' },
  { id: 'green', name: 'Verde', color: '160 80% 45%' },
  { id: 'yellow', name: 'Amarelo', color: '45 95% 55%' },
  { id: 'neutral', name: 'Neutro', color: '0 0% 70%' },
  { id: 'red', name: 'Vermelho', color: '0 85% 50%' },
  { id: 'purple', name: 'Roxo', color: '270 80% 45%' },
  { id: 'pink', name: 'Rosa', color: '330 85% 60%' },
  { id: 'orange', name: 'Laranja', color: '25 95% 55%' },
  { id: 'lilac', name: 'Lilás', color: '280 65% 70%' },
  { id: 'gray', name: 'Cinza', color: '220 15% 55%' },
  { id: 'mint', name: 'Menta', color: '170 70% 50%' },
];

const DRACO_OPTIONS: { id: DracoState['color']; name: string }[] = [
  { id: 'white', name: 'Branco' },
  { id: 'gray', name: 'Cinza' },
  { id: 'lavender', name: 'Lavanda' },
  { id: 'orange', name: 'Laranja' },
  { id: 'pink', name: 'Rosa' },
  { id: 'purple', name: 'Roxo' },
  { id: 'red', name: 'Vermelho' },
  { id: 'black', name: 'Preto' },
  { id: 'silver', name: 'Prata' },
  { id: 'gold', name: 'Dourado' },
  { id: 'rainbow', name: 'Arco-íris' },
  { id: 'green', name: 'Verde' },
  { id: 'blue', name: 'Azul' },
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
  const { signOut, user: authUser, resetPassword } = useAuth();
  const { saveProfile, saveDraco } = useCloudSync();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminderTime, setNewReminderTime] = useState('09:00');
  const [newReminderMessage, setNewReminderMessage] = useState('');
  const [editingReminder, setEditingReminder] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [sendingPasswordReset, setSendingPasswordReset] = useState(false);

  // Ensure notificationReminders is always an array
  const getReminders = (): NotificationReminder[] => {
    if (!settings.notificationReminders) return [];
    if (Array.isArray(settings.notificationReminders)) return settings.notificationReminders;
    if (typeof settings.notificationReminders === 'string') {
      try {
        const parsed = JSON.parse(settings.notificationReminders);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const reminders = getReminders();

  // Profile state - initialize with current user/draco data
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [birthDate, setBirthDate] = useState(user?.birthDate || '');
  const [photoPreview, setPhotoPreview] = useState(user?.photo || '');
  const [dracoName, setDracoName] = useState(draco.name || 'Draco');
  const [dracoNameError, setDracoNameError] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColor, setCustomColor] = useState<HSLColor>(
    settings.customColor || { h: 200, s: 80, l: 50 }
  );

  // Photo cropper state
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [showPhotoCropper, setShowPhotoCropper] = useState(false);

  // Sync local state when user/draco data changes from cloud
  useEffect(() => {
    if (user?.firstName) setFirstName(user.firstName);
    if (user?.lastName !== undefined) setLastName(user.lastName || '');
    if (user?.birthDate !== undefined) setBirthDate(user.birthDate || '');
    if (user?.photo !== undefined) setPhotoPreview(user.photo || '');
  }, [user?.firstName, user?.lastName, user?.birthDate, user?.photo]);

  useEffect(() => {
    if (draco.name) setDracoName(draco.name);
  }, [draco.name]);

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

  const handleLogout = async () => {
    await signOut();
    logout();
    setShowLogoutConfirm(false);
    toast({
      title: 'Até logo!',
      description: 'Você foi desconectado',
    });
  };

  const handleDeleteAccount = async () => {
    await signOut();
    logout();
    toast({
      title: 'Conta excluída',
      description: 'Sua conta foi removida',
    });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'O tamanho máximo é 5MB',
          variant: 'destructive',
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPendingPhoto(result);
        setShowPhotoCropper(true);
      };
      reader.readAsDataURL(file);
    }
    // Reset input value to allow re-selecting the same file
    e.target.value = '';
  };

  const handlePhotoCropSave = (croppedPhoto: string) => {
    setPhotoPreview(croppedPhoto);
    setShowPhotoCropper(false);
    setPendingPhoto(null);
    toast({
      title: 'Foto ajustada! 📸',
      description: 'Lembre-se de salvar o perfil para aplicar',
    });
  };

  const handlePhotoCropCancel = () => {
    setShowPhotoCropper(false);
    setPendingPhoto(null);
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

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    const profileData = {
      firstName,
      lastName,
      birthDate,
      photo: photoPreview,
    };
    updateUser(profileData);
    updateDraco({ name: dracoName });

    // Save to cloud
    await saveProfile(profileData);
    await saveDraco({ ...draco, name: dracoName });

    setSavingProfile(false);
    toast({
      title: 'Perfil atualizado!',
      description: 'Suas informações foram salvas na nuvem',
    });
  };

  const handlePasswordReset = async () => {
    const email = authUser?.email || user?.email;
    if (!email) {
      toast({
        title: 'Erro',
        description: 'Nenhum email encontrado para enviar a redefinição',
        variant: 'destructive',
      });
      return;
    }

    setSendingPasswordReset(true);
    const { error } = await resetPassword(email);
    setSendingPasswordReset(false);

    if (error) {
      toast({
        title: 'Erro ao enviar email',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Email enviado! 📧',
        description: `Enviamos um link de redefinição para ${email}`,
      });
    }
  };

  const addReminder = () => {
    const message = newReminderMessage.trim() || FRIENDLY_MESSAGES[Math.floor(Math.random() * FRIENDLY_MESSAGES.length)];
    const newReminder: NotificationReminder = {
      id: Date.now().toString(),
      time: newReminderTime,
      message: message,
      enabled: true,
    };
    updateSettings({
      notificationReminders: [...reminders, newReminder],
    });
    setShowAddReminder(false);
    setNewReminderTime('09:00');
    setNewReminderMessage('');
    toast({
      title: 'Lembrete adicionado! 🎉',
      description: `Você será lembrado às ${newReminderTime}`,
    });
  };

  const updateReminderTime = (id: string, time: string) => {
    updateSettings({
      notificationReminders: reminders.map((r) =>
        r.id === id ? { ...r, time } : r
      ),
    });
  };

  const removeReminder = (id: string) => {
    updateSettings({
      notificationReminders: reminders.filter((r) => r.id !== id),
    });
    toast({
      title: 'Lembrete removido',
      description: 'O lembrete foi excluído',
    });
  };

  const toggleReminder = (id: string) => {
    updateSettings({
      notificationReminders: reminders.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      ),
    });
  };

  const updateReminderMessage = (id: string, message: string) => {
    updateSettings({
      notificationReminders: reminders.map((r) =>
        r.id === id ? { ...r, message } : r
      ),
    });
  };

  const age = calculateAge(birthDate);

  // Check for desktop
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen ${isDesktop ? 'pb-8' : 'pb-20'}`}
    >
      <UniversalHeader />

      <div className={cn("p-4", isDesktop && "max-w-2xl mx-auto")}>
        <header className="mb-6">
          <h1 className={`font-bold text-gradient-primary ${isDesktop ? 'text-3xl' : 'text-2xl'}`}>Configurações</h1>
          <p className="text-muted-foreground">Personalize sua experiência</p>
        </header>

        <div className="space-y-4">
          {/* Profile Section */}
          <section className="glass-card rounded-2xl p-4">
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
                  <DracoIcon level={draco.level} color={draco.color} />
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

              <div className="space-y-3">
                <label className="text-xs text-muted-foreground">Escolha seu Draco</label>

                {/* Large Draco Preview */}
                <div className="flex justify-center">
                  <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-primary/30 shadow-lg">
                    <img
                      src={DRACO_IMAGES[draco.color]}
                      alt={`Draco ${draco.color}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Color Circles */}
                <div className="flex flex-wrap justify-center gap-2">
                  {DRACO_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => updateDraco({ color: option.id })}
                      className={cn(
                        'relative w-8 h-8 rounded-full overflow-hidden border-2 transition-all',
                        draco.color === option.id
                          ? 'border-primary ring-2 ring-primary/50 scale-110'
                          : 'border-border/50 hover:border-primary/50 hover:scale-105'
                      )}
                      title={option.name}
                    >
                      <img
                        src={DRACO_IMAGES[option.id]}
                        alt={option.name}
                        className="w-full h-full object-cover"
                      />
                      {draco.color === option.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/30">
                          <Check className="w-4 h-4 text-primary-foreground drop-shadow-md" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleSaveProfile} disabled={savingProfile} className="btn-fire w-full flex items-center justify-center gap-2 py-2">
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {savingProfile ? 'Salvando...' : 'Salvar perfil'}
              </button>
            </div>
          </section>

          {/* Wallpaper Section */}
          <WallpaperSection />

          {/* Theme */}
          <section className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Palette className="w-5 h-5 text-primary-foreground" />
              </div>
              <h2 className="font-semibold text-foreground">Cor do Tema</h2>
            </div>

            <div className="space-y-4">
              {/* Preset Colors */}
              <div>
                <p className="text-sm text-muted-foreground mb-3">Cores predefinidas</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {THEME_OPTIONS.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => {
                        updateSettings({ themeColor: theme.id });
                        setShowColorPicker(false);
                      }}
                      className={cn(
                        'relative w-8 h-8 rounded-full border-2 transition-all',
                        settings.themeColor === theme.id && !showColorPicker
                          ? 'border-primary ring-2 ring-primary/50 scale-110'
                          : 'border-border/50 hover:border-primary/50 hover:scale-105'
                      )}
                      title={theme.name}
                      style={{
                        backgroundColor: `hsl(${theme.color})`
                      }}
                    >
                      {settings.themeColor === theme.id && !showColorPicker && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white drop-shadow-md" />
                        </div>
                      )}
                    </button>
                  ))}

                  {/* Custom Color Button */}
                  <button
                    onClick={() => {
                      setShowColorPicker(!showColorPicker);
                      if (!showColorPicker) {
                        updateSettings({ themeColor: 'custom', customColor });
                      }
                    }}
                    className={cn(
                      'relative w-8 h-8 rounded-full border-2 transition-all overflow-hidden',
                      settings.themeColor === 'custom' || showColorPicker
                        ? 'border-primary ring-2 ring-primary/50 scale-110'
                        : 'border-border/50 hover:border-primary/50 hover:scale-105'
                    )}
                    title="Cor personalizada"
                    style={{
                      background: `conic-gradient(
                      from 0deg,
                      hsl(0, 80%, 50%),
                      hsl(60, 80%, 50%),
                      hsl(120, 80%, 50%),
                      hsl(180, 80%, 50%),
                      hsl(240, 80%, 50%),
                      hsl(300, 80%, 50%),
                      hsl(360, 80%, 50%)
                    )`,
                    }}
                  >
                    {(settings.themeColor === 'custom' || showColorPicker) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Check className="w-4 h-4 text-white drop-shadow-md" />
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Color Wheel Picker */}
              <AnimatePresence>
                {showColorPicker && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 border-t border-border/30">
                      <p className="text-sm text-muted-foreground mb-4 text-center">Escolha qualquer cor</p>
                      <ColorWheelPicker
                        value={customColor}
                        onChange={(color) => {
                          setCustomColor(color);
                          updateSettings({ themeColor: 'custom', customColor: color });
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="pt-4 border-t border-border/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Moon className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Modo Noturno</p>
                      <p className="text-sm text-muted-foreground">Ativar tema escuro</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.darkMode}
                    onCheckedChange={(checked) => updateSettings({ darkMode: checked })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/30">
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

              {/* Streak Color */}
              <div className="pt-4 border-t border-border/30">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-foreground">Cor da Streak</p>
                    <p className="text-sm text-muted-foreground">Personalize a cor do ícone de streak</p>
                  </div>
                </div>

                {/* Preview */}
                <div className="flex items-center justify-center gap-2 mb-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                  <Flame className="w-5 h-5" style={{ color: settings.streakColor || '#fb923c' }} />
                  <span className="text-sm font-semibold" style={{ color: settings.streakColor || '#fb923c' }}>5 dias de streak</span>
                </div>

                {/* Color Options */}
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    { id: 'orange', color: '#fb923c', name: 'Laranja' },
                    { id: 'red', color: '#ef4444', name: 'Vermelho' },
                    { id: 'yellow', color: '#eab308', name: 'Amarelo' },
                    { id: 'green', color: '#22c55e', name: 'Verde' },
                    { id: 'blue', color: '#3b82f6', name: 'Azul' },
                    { id: 'purple', color: '#a855f7', name: 'Roxo' },
                    { id: 'pink', color: '#ec4899', name: 'Rosa' },
                    { id: 'cyan', color: '#06b6d4', name: 'Ciano' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => updateSettings({ streakColor: opt.color })}
                      className={cn(
                        'relative w-8 h-8 rounded-full border-2 transition-all',
                        (settings.streakColor || '#fb923c') === opt.color
                          ? 'border-foreground ring-2 ring-foreground/30 scale-110'
                          : 'border-border/50 hover:border-foreground/50 hover:scale-105'
                      )}
                      title={opt.name}
                      style={{ backgroundColor: opt.color }}
                    >
                      {(settings.streakColor || '#fb923c') === opt.color && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white drop-shadow-md" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Categories Section */}
          <CategoriesSection />

          {/* Health Settings */}
          <section className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Moon className="w-5 h-5 text-primary-foreground" />
              </div>
              <h2 className="font-semibold text-foreground">Saúde & Bem-estar</h2>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Mínimo de sono diário</p>
                    <p className="text-sm text-muted-foreground">Horas recomendadas de sono</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="24"
                      step="0.5"
                      value={settings.minSleepHours || 7}
                      onChange={(e) => updateSettings({ minSleepHours: parseFloat(e.target.value) || 7 })}
                      className="w-20 px-3 py-2 rounded-lg bg-muted/50 border border-border/50 text-foreground text-center font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <span className="text-sm text-muted-foreground">horas</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Máximo de celular inútil</p>
                    <p className="text-sm text-muted-foreground">Tempo máximo de uso improdutivo</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                      value={settings.maxPhoneHours || 2}
                      onChange={(e) => updateSettings({ maxPhoneHours: parseFloat(e.target.value) || 2 })}
                      className="w-20 px-3 py-2 rounded-lg bg-muted/50 border border-border/50 text-foreground text-center font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <span className="text-sm text-muted-foreground">horas</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section className="glass-card rounded-2xl p-4">
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
                      {reminders.map((reminder) => (
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
                              <input
                                type="time"
                                value={reminder.time}
                                onChange={(e) => updateReminderTime(reminder.id, e.target.value)}
                                className="font-semibold text-foreground bg-transparent border-none outline-none w-20"
                              />
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
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Horário</label>
                              <input
                                type="time"
                                value={newReminderTime}
                                onChange={(e) => setNewReminderTime(e.target.value)}
                                className="w-full bg-muted/50 border border-border/50 rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Mensagem (opcional)</label>
                              <input
                                type="text"
                                value={newReminderMessage}
                                onChange={(e) => setNewReminderMessage(e.target.value)}
                                placeholder="Deixe vazio para mensagem automática"
                                className="w-full bg-muted/50 border border-border/50 rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                              />
                            </div>
                            <button
                              onClick={addReminder}
                              className="w-full px-4 py-2 gradient-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
                            >
                              Adicionar
                            </button>
                          </div>
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
          <section className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <User className="w-5 h-5 text-primary-foreground" />
              </div>
              <h2 className="font-semibold text-foreground">Conta</h2>
            </div>

            <div className="space-y-1">
              <div className="py-2 px-1">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{authUser?.email || user?.email || 'Não informado'}</p>
              </div>

              <button
                onClick={handlePasswordReset}
                disabled={sendingPasswordReset}
                className="w-full py-3 flex items-center justify-between text-left hover:bg-muted/30 rounded-xl transition-colors px-3 disabled:opacity-50"
              >
                <span className="text-foreground flex items-center gap-2">
                  {sendingPasswordReset && <Loader2 className="w-4 h-4 animate-spin" />}
                  {sendingPasswordReset ? 'Enviando...' : 'Alterar senha'}
                </span>
                {!sendingPasswordReset && <ChevronRight className="w-5 h-5 text-muted-foreground" />}
              </button>

              {showLogoutConfirm ? (
                <div className="p-3 border border-border/50 rounded-xl space-y-3 bg-muted/30">
                  <p className="text-sm text-foreground">
                    Tem certeza que deseja sair da conta?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowLogoutConfirm(false)}
                      className="flex-1 py-2 bg-muted/50 text-foreground rounded-xl text-sm font-medium hover:bg-muted transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex-1 py-2 gradient-primary text-primary-foreground rounded-xl text-sm font-medium"
                    >
                      Sair
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full py-3 flex items-center gap-3 text-left hover:bg-muted/30 rounded-xl transition-colors px-3"
                >
                  <LogOut className="w-5 h-5 text-foreground" />
                  <span className="text-foreground">Sair da conta</span>
                </button>
              )}

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
          <section className="bg-muted/20 backdrop-blur-sm border border-border/30 rounded-2xl p-4">
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
      </div>

      {/* Photo Cropper Modal */}
      <AnimatePresence>
        {showPhotoCropper && pendingPhoto && (
          <ImageCropper
            imageSrc={pendingPhoto}
            aspectRatio={1}
            onSave={handlePhotoCropSave}
            onCancel={handlePhotoCropCancel}
            outputWidth={400}
            circular={true}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
