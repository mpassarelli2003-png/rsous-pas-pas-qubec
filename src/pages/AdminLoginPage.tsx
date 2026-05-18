import { useState } from 'react';
import { Page, PageBody, Card, Button, Input } from '@/lib/ui';
import { useNavigate, Link } from '@tanstack/react-router';
import { ShieldAlert, Lock, Home } from 'lucide-react';
import { adminLogin } from '../lib/adminStore';

export function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (adminLogin(password)) {
      navigate({ to: '/admin' });
    } else {
      setError('Mot de passe incorrect. Réessaie.');
    }
  };

  return (
    <Page>
      <PageBody className="flex items-center justify-center min-h-[80vh]">
        <Card className="max-w-md w-full p-8 border-2 shadow-xl space-y-8 bg-white">

          {/* Icône + titre */}
          <div className="text-center space-y-2">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Espace Administrateur</h1>
            <p className="text-muted-foreground text-sm">
              Accès réservé aux enseignants et administrateurs.
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-11 border-2"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  autoFocus
                />
              </div>
              {/* Message d'erreur inline */}
              {error && (
                <p className="text-sm text-red-600 font-medium flex items-center gap-1.5 pt-1">
                  <span>⚠️</span> {error}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full h-11 text-base font-bold">
              Se connecter
            </Button>
          </form>

          {/* Bouton Retour à l'accueil */}
          <div className="pt-2 border-t text-center">
            <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground hover:text-foreground">
              <Link to="/">
                <Home className="h-4 w-4" />
                Retour à l'accueil
              </Link>
            </Button>
          </div>
        </Card>
      </PageBody>
    </Page>
  );
}
