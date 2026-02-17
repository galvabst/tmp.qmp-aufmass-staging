import { useState, useEffect } from 'react';
import { Video, Save, Check, Type, Euro } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTrainerProfile } from '@/hooks/useTrainerProfile';
import { MultiSourceVideoPlayer } from '@/components/akademie/MultiSourceVideoPlayer';
import { toast } from 'sonner';

interface TrainerProfileEditorProps {
  profileId: string;
}

export function TrainerProfileEditor({ profileId }: TrainerProfileEditorProps) {
  const { data, isLoading, updateTrainerProfile, isUpdating } = useTrainerProfile(profileId);
  const [videoUrl, setVideoUrl] = useState('');
  const [bio, setBio] = useState('');
  const [preis, setPreis] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (data) {
      setVideoUrl(data.trainer_video_url || '');
      setBio(data.trainer_bio || '');
      setPreis(data.trainer_coaching_preis != null ? String(data.trainer_coaching_preis) : '');
    }
  }, [data]);

  useEffect(() => {
    if (!data) return;
    const preisStr = data.trainer_coaching_preis != null ? String(data.trainer_coaching_preis) : '';
    const changed =
      (videoUrl !== (data.trainer_video_url || '')) ||
      (bio !== (data.trainer_bio || '')) ||
      (preis !== preisStr);
    setHasChanges(changed);
  }, [videoUrl, bio, preis, data]);

  const handleSave = async () => {
    try {
      await updateTrainerProfile({
        trainer_video_url: videoUrl.trim() || null,
        trainer_bio: bio.trim() || null,
        trainer_coaching_preis: preis.trim() ? parseFloat(preis.trim()) : null,
      });
      setHasChanges(false);
      toast.success('Trainer-Profil gespeichert');
    } catch (error) {
      console.error('[TrainerProfileEditor] Save failed:', error);
      toast.error('Fehler beim Speichern');
    }
  };

  if (isLoading) return null;

  return (
    <section className="p-4 pt-0">
      <h2 className="text-sm font-medium text-muted-foreground mb-3">Trainer-Profil</h2>
      <div className="bg-card rounded-lg shadow-card p-4 space-y-4">
        {/* Video URL */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Video className="w-4 h-4 text-primary" />
            Vorstellungsvideo
          </label>
          <Input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://video.bunnycdn.com/play/... oder YouTube-URL"
            className="text-sm"
          />
          {videoUrl.trim() && (
            <div className="rounded-lg overflow-hidden mt-2">
              <MultiSourceVideoPlayer
                videoUrl={videoUrl.trim()}
                heightMode="contained"
              />
            </div>
          )}
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Type className="w-4 h-4 text-primary" />
            Kurzbeschreibung
          </label>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 200))}
            placeholder="Erzähle den Onboardern etwas über dich..."
            rows={3}
            className="text-sm resize-none"
          />
          <p className="text-[11px] text-muted-foreground text-right">
            {bio.length}/200 Zeichen
          </p>
        </div>

        {/* Coaching-Preis */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Euro className="w-4 h-4 text-primary" />
            Coaching-Preis (brutto)
          </label>
          <div className="relative">
            <Input
              type="number"
              value={preis}
              onChange={(e) => setPreis(e.target.value)}
              placeholder="z.B. 149.00"
              min={0}
              step={0.01}
              className="text-sm pr-14"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
              EUR
            </span>
          </div>
        </div>

        {/* Save */}
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isUpdating}
          className="w-full gap-2"
          size="sm"
        >
          {isUpdating ? (
            <Save className="w-4 h-4 animate-spin" />
          ) : hasChanges ? (
            <Save className="w-4 h-4" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          {isUpdating ? 'Speichern...' : hasChanges ? 'Speichern' : 'Gespeichert'}
        </Button>
      </div>
    </section>
  );
}
