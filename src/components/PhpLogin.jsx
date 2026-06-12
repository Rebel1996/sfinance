import { useState } from 'react';
import { authApi } from '@/api/phpClient';
import { TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PhpLogin({ onLogin }) {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ full_name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let res;
      if (tab === 'login') {
        res = await authApi.login(form.email, form.password);
      } else {
        res = await authApi.register(form.full_name, form.email, form.password);
      }
      // Sauvegarde les deux tokens (access + refresh)
      authApi.saveTokens(res.access_token, res.refresh_token);
      onLogin(res.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mx-auto">
            <TrendingUp className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">FinTrack</h1>
          <p className="text-sm text-muted-foreground">Gérez vos finances en toute simplicité</p>
        </div>

        <div className="bg-card border rounded-2xl p-6 space-y-4 shadow-sm">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full">
              <TabsTrigger value="login" className="flex-1">Connexion</TabsTrigger>
              <TabsTrigger value="register" className="flex-1">Inscription</TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'register' && (
              <div className="space-y-2">
                <Label>Nom complet</Label>
                <Input
                  placeholder="Jean Dupont"
                  value={form.full_name}
                  onChange={e => update('full_name', e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="email@exemple.com"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Mot de passe</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => update('password', e.target.value)}
                required
                minLength={8}
              />
              {tab === 'register' && (
                <p className="text-xs text-muted-foreground">
                  8 caractères minimum, avec au moins une lettre et un chiffre.
                </p>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Chargement...' : tab === 'login' ? 'Se connecter' : "S'inscrire"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
