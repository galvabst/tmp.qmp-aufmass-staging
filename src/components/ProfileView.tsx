import { User, Mail, Phone, MapPin, Settings, LogOut, ChevronRight, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ProfileView() {
  const navigate = useNavigate();
  
  const menuItems = [
    { icon: User, label: 'Persönliche Daten', href: '#' },
    { icon: Settings, label: 'Einstellungen', href: '#' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-primary text-primary-foreground safe-area-top">
        <div className="p-6 pt-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-foreground/20 rounded-full flex items-center justify-center">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Max Mustermann</h1>
              <p className="text-primary-foreground/80 text-sm">Feinaufmaßtechniker</p>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="px-4 -mt-4">
        <div className="bg-card rounded-lg shadow-card p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-foreground">127</p>
              <p className="text-xs text-muted-foreground">Aufträge</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-status-accepted">98%</p>
              <p className="text-xs text-muted-foreground">Annahmerate</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">4.9</p>
              <p className="text-xs text-muted-foreground">Bewertung</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <section className="p-4 mt-4">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Kontaktdaten</h2>
        <div className="bg-card rounded-lg shadow-card divide-y divide-border">
          <div className="flex items-center gap-3 p-4">
            <Mail className="w-5 h-5 text-muted-foreground" />
            <span className="text-foreground">max.mustermann@email.de</span>
          </div>
          <div className="flex items-center gap-3 p-4">
            <Phone className="w-5 h-5 text-muted-foreground" />
            <span className="text-foreground">+49 151 12345678</span>
          </div>
          <div className="flex items-center gap-3 p-4">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <span className="text-foreground">München, Bayern</span>
          </div>
        </div>
      </section>

      {/* Menu */}
      <section className="p-4">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Einstellungen</h2>
        <div className="bg-card rounded-lg shadow-card divide-y divide-border">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors"
              >
                <Icon className="w-5 h-5 text-muted-foreground" />
                <span className="flex-1 text-foreground">{item.label}</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </a>
            );
          })}
        </div>
      </section>

      {/* Admin Link */}
      <section className="p-4">
        <button 
          onClick={() => navigate('/admin')}
          className="w-full flex items-center justify-center gap-2 p-4 bg-primary rounded-lg shadow-card text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          <Shield className="w-5 h-5" />
          Admin-Bereich
        </button>
      </section>

      {/* Logout */}
      <section className="p-4 pt-0">
        <button className="w-full flex items-center justify-center gap-2 p-4 bg-card rounded-lg shadow-card text-destructive font-medium hover:bg-destructive/5 transition-colors">
          <LogOut className="w-5 h-5" />
          Abmelden
        </button>
      </section>
    </div>
  );
}
