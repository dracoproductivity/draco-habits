import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Camera, Save } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { DracoIcon } from '@/components/icons/DracoIcon';
import { XPBar } from '@/components/ui/XPBar';
import { toast } from '@/hooks/use-toast';

export const ProfilePage = () => {
  const { user, updateUser, draco } = useAppStore();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [age, setAge] = useState(user?.age?.toString() || '');
  const [photoPreview, setPhotoPreview] = useState(user?.photo || '');

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

  const handleSave = () => {
    updateUser({
      firstName,
      lastName,
      age: parseInt(age) || 0,
      photo: photoPreview,
    });
    toast({
      title: 'Perfil atualizado!',
      description: 'Suas informações foram salvas',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pb-20 p-4"
    >
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gradient-fire">Perfil</h1>
        <p className="text-muted-foreground">Suas informações pessoais</p>
      </header>

      {/* Draco stats card */}
      <div className="card-dark p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 animate-float">
            <DracoIcon level={draco.level} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">Draco - Nível {draco.level}</h3>
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

      {/* Profile form */}
      <div className="card-dark p-6 space-y-6">
        {/* Photo */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-4 border-primary/30">
              {photoPreview ? (
                <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full gradient-fire flex items-center justify-center cursor-pointer">
              <Camera className="w-4 h-4 text-primary-foreground" />
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
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Nome</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="input-dark w-full"
              placeholder="Seu nome"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Sobrenome</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="input-dark w-full"
              placeholder="Seu sobrenome"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Idade</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="input-dark w-full"
            placeholder="Sua idade"
            min="0"
            max="150"
          />
        </div>

        <button onClick={handleSave} className="btn-fire w-full flex items-center justify-center gap-2">
          <Save className="w-4 h-4" />
          Salvar alterações
        </button>
      </div>
    </motion.div>
  );
};
