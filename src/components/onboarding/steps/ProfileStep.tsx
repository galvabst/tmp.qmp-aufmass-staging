import { useState } from 'react';
import { Camera, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ApplicantProfile } from '@/types/onboarding';

interface ProfileStepProps {
  profile: ApplicantProfile;
  onProfileChange: (profile: ApplicantProfile) => void;
  onAvatarUpload: (file: File) => void;
}

export function ProfileStep({ profile, onProfileChange, onAvatarUpload }: ProfileStepProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleChange = (field: keyof ApplicantProfile, value: string) => {
    onProfileChange({ ...profile, [field]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAvatarUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onAvatarUpload(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Avatar Upload */}
      <div className="flex flex-col items-center">
        <div className="text-center mb-4">
          <h3 className="font-semibold text-foreground">Profilfoto für Ausweiskarte</h3>
          <p className="text-sm text-muted-foreground">Wird auf deiner Thermocheck-Ausweiskarte gedruckt</p>
        </div>
        
        <div
          className={`relative cursor-pointer transition-all ${dragActive ? 'scale-105' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <Avatar className="w-32 h-32 border-4 border-dashed border-muted-foreground/30">
            {profile.avatarUrl ? (
              <AvatarImage src={profile.avatarUrl} alt="Profilbild" />
            ) : (
              <AvatarFallback className="bg-muted">
                <User className="w-12 h-12 text-muted-foreground" />
              </AvatarFallback>
            )}
          </Avatar>
          
          <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
            <Camera className="w-5 h-5" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>
      </div>

      {/* Persönliche Daten */}
      <div className="bg-card rounded-xl p-4 shadow-card space-y-4">
        <h3 className="font-semibold text-foreground">Persönliche Daten</h3>
        <p className="text-sm text-muted-foreground">Prüfe deine Daten aus der Bewerbung</p>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="vorname">Vorname</Label>
            <Input
              id="vorname"
              value={profile.vorname}
              onChange={(e) => handleChange('vorname', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="nachname">Nachname</Label>
            <Input
              id="nachname"
              value={profile.nachname}
              onChange={(e) => handleChange('nachname', e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email">E-Mail</Label>
          <Input
            id="email"
            type="email"
            value={profile.email}
            onChange={(e) => handleChange('email', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="telefon">Telefon</Label>
          <Input
            id="telefon"
            type="tel"
            value={profile.telefon}
            onChange={(e) => handleChange('telefon', e.target.value)}
          />
        </div>
      </div>

      {/* Adresse */}
      <div className="bg-card rounded-xl p-4 shadow-card space-y-4">
        <h3 className="font-semibold text-foreground">Adresse</h3>
        <p className="text-sm text-muted-foreground">Für Lieferung der Arbeitskleidung</p>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Label htmlFor="strasse">Straße</Label>
            <Input
              id="strasse"
              value={profile.strasse}
              onChange={(e) => handleChange('strasse', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="hausnummer">Nr.</Label>
            <Input
              id="hausnummer"
              value={profile.hausnummer}
              onChange={(e) => handleChange('hausnummer', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="plz">PLZ</Label>
            <Input
              id="plz"
              value={profile.plz}
              onChange={(e) => handleChange('plz', e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="ort">Ort</Label>
            <Input
              id="ort"
              value={profile.ort}
              onChange={(e) => handleChange('ort', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
