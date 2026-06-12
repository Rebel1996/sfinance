import { useState, useRef, useEffect } from "react";
import { useAppContext, THEMES, CURRENCIES } from "@/lib/AppContext";
import { useUser } from "@/lib/UserContext";
import { authApi } from "@/api/phpClient";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Palette,
  DollarSign,
  Moon,
  CheckCircle2,
  Camera,
  User,
  Mail,
  Lock,
  Trash2,
  Shield,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const THEME_PREVIEWS = {
  default: "bg-emerald-500",
  ocean: "bg-blue-500",
  violet: "bg-violet-500",
  sunset: "bg-orange-500",
  rose: "bg-rose-500",
  slate: "bg-slate-500",
};

// ─── Avatar ──────────────────────────────────────────────────────────────────
function AvatarEditor({ user, onSaved }) {
  const fileRef = useRef(null);
  const { toast } = useToast();
  const [preview, setPreview] = useState(user?.avatar_url || null);

  // Synchronisation si l'avatar change depuis le serveur
  useEffect(() => {
    setPreview(user?.avatar_url || null);
  }, [user?.avatar_url]);

  const mutation = useMutation({
    mutationFn: (avatarUrl) => authApi.updateAvatar(avatarUrl),
    onSuccess: (updated) => {
      onSaved(updated);
      toast({ title: "Avatar mis à jour" });
    },
    onError: (e) =>
      toast({
        title: "Erreur",
        description: e.message,
        variant: "destructive",
      }),
  });

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Image trop lourde",
        description: "Maximum 2 Mo",
        variant: "destructive",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 120;
        canvas.height = 120;
        const ctx = canvas.getContext("2d");
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, 120, 120);
        const compressed = canvas.toDataURL("image/jpeg", 0.75);
        setPreview(compressed);
        mutation.mutate(compressed);
      };
      img.onerror = () => {
        toast({
          title: "Erreur",
          description: "Impossible de lire ce fichier image.",
          variant: "destructive",
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  function handleRemove() {
    setPreview(null);
    mutation.mutate(null);
  }

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : (user?.email?.[0] || "?").toUpperCase();

  return (
    <div className="flex items-center gap-5">
      <div className="relative">
        {preview ? (
          <img
            src={preview}
            alt="Avatar"
            className="w-16 h-16 rounded-full object-cover ring-4 ring-indigo-500/10"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 text-white flex items-center justify-center text-xl font-black ring-4 ring-indigo-500/10">
            {initials}
          </div>
        )}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-label="Changer la photo de profil"
          className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md hover:bg-indigo-700 transition-colors border-2 border-white dark:border-slate-900"
        >
          {mutation.isPending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Camera className="w-3 h-3" />
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
          {user?.full_name || "Utilisateur"}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-1.5">
          {user?.email}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors"
          >
            Changer la photo
          </button>
          {preview && (
            <>
              <span className="text-xs text-slate-300 dark:text-slate-700">
                •
              </span>
              <button
                type="button"
                onClick={handleRemove}
                className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors"
              >
                Supprimer
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Infos personnelles ───────────────────────────────────────────────────────
function ProfileForm({ user, onSaved }) {
  const { toast } = useToast();
  const [name, setName] = useState(user?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");

  // Correctif crucial : Met à jour les champs dès que les données du user arrivent
  useEffect(() => {
    if (user) {
      setName(user.full_name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: () => authApi.updateProfile({ full_name: name, email }),
    onSuccess: (updated) => {
      onSaved(updated);
      toast({ title: "Profil mis à jour" });
    },
    onError: (e) =>
      toast({
        title: "Erreur",
        description: e.message,
        variant: "destructive",
      }),
  });

  const dirty =
    name !== (user?.full_name || "") || email !== (user?.email || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email) return;
    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label
            htmlFor="full_name"
            className="text-xs font-bold text-slate-600 dark:text-slate-300"
          >
            Nom complet
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="full_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-9 h-10 text-sm rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500"
              placeholder="Votre nom"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="email"
            className="text-xs font-bold text-slate-600 dark:text-slate-300"
          >
            Adresse email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9 h-10 text-sm rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500"
              placeholder="email@exemple.com"
            />
          </div>
        </div>
      </div>
      <AnimatePresence>
        {dirty && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-1 overflow-hidden"
          >
            <Button
              type="submit"
              size="sm"
              disabled={mutation.isPending || !name || !email}
              className="h-9 px-4 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
            >
              {mutation.isPending && (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              )}
              Enregistrer les modifications
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}

// ─── Changement de mot de passe ───────────────────────────────────────────────
function PasswordForm() {
  const { toast } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      authApi.updatePassword({ current_password: current, new_password: next }),
    onSuccess: () => {
      toast({ title: "Mot de passe mis à jour" });
      setCurrent("");
      setNext("");
      setConfirm("");
    },
    onError: (e) =>
      toast({
        title: "Erreur",
        description: e.message,
        variant: "destructive",
      }),
  });

  const mismatch = next && confirm && next !== confirm;
  const ready =
    current && next && confirm && next === confirm && next.length >= 6;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!ready) return;
    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3.5">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">
            Mot de passe actuel
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type={showCurrent ? "text" : "password"}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="pl-9 pr-9 h-10 text-sm rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              {showCurrent ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Nouveau mot de passe
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type={showNext ? "text" : "password"}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                className="pl-9 pr-9 h-10 text-sm rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500"
                placeholder="Min. 6 caractères"
              />
              <button
                type="button"
                onClick={() => setShowNext((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showNext ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Confirmer le mot de passe
            </Label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={cn(
                "h-10 text-sm rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500",
                mismatch &&
                  "border-rose-400 focus-visible:ring-rose-400 bg-rose-50/20",
              )}
              placeholder="Répéter le mot de passe"
            />
            {mismatch && (
              <p role="alert" className="text-[10px] font-bold text-rose-500 pl-1">
                Les mots de passe ne correspondent pas
              </p>
            )}
          </div>
        </div>
      </div>

      <Button
        type="submit"
        size="sm"
        disabled={mutation.isPending || !ready}
        className="h-9 px-4 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
      >
        {mutation.isPending && (
          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
        )}
        Mettre à jour le mot de passe
      </Button>
    </form>
  );
}

// ─── Suppression de compte ────────────────────────────────────────────────────
function DeleteAccountSection({ onDeleted }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: () => authApi.deleteAccount(password),
    onSuccess: () => {
      authApi.logout();
      onDeleted();
    },
    onError: (e) =>
      toast({
        title: "Erreur",
        description: e.message,
        variant: "destructive",
      }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password) return;
    mutation.mutate();
  };

  return (
    <div>
      {!open ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="h-9 text-xs font-bold border-rose-200 dark:border-rose-900/40 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
          Supprimer mon compte
        </Button>
      ) : (
        <motion.form
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-3 p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/10"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-rose-700 dark:text-rose-400 leading-relaxed">
              Cette action est <strong>définitive et irréversible</strong>.
              L'ensemble de vos historiques de transactions, comptes bancaires
              reliés et budgets configurés seront effacés sans possibilité de
              restauration.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-rose-700 dark:text-rose-400">
              Confirmez en saisissant votre mot de passe
            </Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 text-sm rounded-xl border-rose-200 dark:border-rose-900/40 bg-white dark:bg-slate-900 focus-visible:ring-rose-500 focus-visible:border-rose-500"
              placeholder="Mot de passe actuel"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              type="submit"
              size="sm"
              variant="destructive"
              disabled={mutation.isPending || !password}
              className="h-9 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700"
            >
              {mutation.isPending && (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              )}
              Supprimer définitivement
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setPassword("");
              }}
              className="h-9 text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            >
              Annuler
            </Button>
          </div>
        </motion.form>
      )}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function Profile() {
  const {
    themeId,
    setThemeId,
    currencyCode,
    setCurrencyCode,
    darkMode,
    setDarkMode,
  } = useAppContext();
  const { user, setUser, onLogout } = useUser();

  return (
    <div className="space-y-6 max-w-2xl pb-12">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">
          Profil & Paramètres
        </h1>
        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">
          Ajustez vos préférences et personnalisez votre expérience FinTrack
        </p>
      </div>

      {/* ── Section Identité ── */}
      <Card className="p-5 border border-slate-100 dark:border-slate-800/60 shadow-sm rounded-2xl space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/40">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500">
            <User className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Informations personnelles
          </h2>
        </div>
        <AvatarEditor user={user} onSaved={setUser} />
        <div className="pt-2">
          <ProfileForm user={user} onSaved={setUser} />
        </div>
      </Card>

      {/* ── Section Sécurité ── */}
      <Card className="p-5 border border-slate-100 dark:border-slate-800/60 shadow-sm rounded-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-500">
              <Shield className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Sécurité du compte
            </h2>
          </div>
          <Badge
            variant="secondary"
            className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md px-2 py-0.5"
          >
            Protection
          </Badge>
        </div>
        <PasswordForm />
      </Card>

      {/* ── Section Design / Thème ── */}
      <Card className="p-5 border border-slate-100 dark:border-slate-800/60 shadow-sm rounded-2xl space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/40">
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500">
            <Palette className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Thématique visuelle
          </h2>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          {THEMES.map((t, i) => (
            <motion.button
              key={t.id}
              type="button"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setThemeId(t.id)}
              className={cn(
                "relative flex flex-col items-center gap-2 p-2.5 rounded-xl border-2 transition-all",
                themeId === t.id
                  ? "border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/10"
                  : "border-slate-100 dark:border-slate-800/40 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/30 dark:bg-slate-950/20",
              )}
            >
              <div
                className={`w-8 h-8 rounded-full ${THEME_PREVIEWS[t.id]} shadow-inner`}
              />
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                {t.label}
              </span>
              {themeId === t.id && (
                <div className="absolute top-1 right-1 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-sm">
                  <CheckCircle2 className="w-3 h-3 text-indigo-600 fill-indigo-600/10" />
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </Card>

      {/* ── Section Mode Sombre ── */}
      <Card className="p-4 border border-slate-100 dark:border-slate-800/60 shadow-sm rounded-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200/40 dark:border-slate-800/60 text-slate-500">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Mode sombre
              </p>
              <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                Basculer le rendu de l'interface en mode nuit
              </p>
            </div>
          </div>
          <Switch
            checked={darkMode}
            onCheckedChange={setDarkMode}
            className="data-[state=active]:bg-indigo-600"
          />
        </div>
      </Card>

      {/* ── Section Devise de Référence ── */}
      <Card className="p-5 border border-slate-100 dark:border-slate-800/60 shadow-sm rounded-2xl space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/40">
          <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-500">
            <DollarSign className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Devise de tenue de compte
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {CURRENCIES.map((c, i) => (
            <motion.button
              key={c.code}
              type="button"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setCurrencyCode(c.code)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
                currencyCode === c.code
                  ? "border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/10"
                  : "border-slate-100 dark:border-slate-800/40 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/20 dark:bg-slate-950/10",
              )}
            >
              <span className="text-xl filter drop-shadow-sm">{c.flag}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {c.code}{" "}
                  <span className="font-medium text-slate-400 dark:text-slate-500">
                    — {c.symbol}
                  </span>
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate font-medium">
                  {c.label}
                </p>
              </div>
              {currencyCode === c.code && (
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
              )}
            </motion.button>
          ))}
        </div>
      </Card>

      {/* ── Section Irréversible (Zone Critique) ── */}
      <Card className="p-5 border border-rose-100 dark:border-rose-900/30 bg-rose-50/10 dark:bg-rose-950/5 shadow-sm rounded-2xl space-y-3.5">
        <div className="flex items-center gap-2 pb-2 border-b border-rose-100/50 dark:border-rose-900/20">
          <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-500">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-rose-600 dark:text-rose-400">
            Zone de danger
          </h2>
        </div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
          Certaines actions de cette zone suppriment définitivement vos données
          de manière irréversible. Veillez à être sûr de vos choix avant toute
          validation.
        </p>
        <div className="pt-1">
          <DeleteAccountSection onDeleted={onLogout} />
        </div>
      </Card>
    </div>
  );
}