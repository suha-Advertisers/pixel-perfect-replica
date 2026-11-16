import { LockKeyhole, ShieldAlert } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

function Screen({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-soft">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-primary-soft text-secondary-foreground">
            {icon}
          </span>
          <h1 className="font-display text-2xl font-bold">{title}</h1>
        </div>
        {children}
      </div>
    </main>
  );
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (err) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
      await new Promise((r) => setTimeout(r, 1500)); // إبطاء المحاولات المتكررة
    }
    setBusy(false);
  }

  async function onForgot() {
    if (!email.trim()) {
      setError("اكتب بريدك الإلكتروني أولاً.");
      return;
    }
    setBusy(true);
    setError(null);
    await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
    setInfo("إن كان البريد مسجّلاً لدينا فسيصلك رابط إعادة تعيين كلمة المرور.");
    setBusy(false);
  }

  return (
    <Screen icon={<LockKeyhole className="size-7" />} title="تسجيل الدخول">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input id="email" type="email" dir="ltr" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">كلمة المرور</Label>
          <Input id="password" type="password" dir="ltr" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {info && <p role="status" className="text-sm text-muted-foreground">{info}</p>}
        <Button type="submit" variant="gold" size="lg" className="w-full" disabled={busy}>
          {busy ? "جارٍ التحقق…" : "دخول"}
        </Button>
        <button type="button" onClick={onForgot} disabled={busy} className="w-full text-center text-sm text-primary hover:underline">
          نسيت كلمة المرور؟
        </button>
      </form>
      <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
        التسجيل بالدعوة فقط. إن لم تصلك دعوة فتواصل مع مدير النظام.
      </p>
    </Screen>
  );
}

function SetPasswordScreen() {
  const { completePasswordSetup } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 10) return setError("كلمة المرور يجب ألا تقل عن 10 أحرف.");
    if (/^\d+$/.test(password)) return setError("لا تجعل كلمة المرور أرقاماً فقط.");
    if (password !== confirm) return setError("كلمتا المرور غير متطابقتين.");
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) return setError("تعذّر حفظ كلمة المرور. جرّب كلمة أقوى أو اطلب رابطاً جديداً.");
    completePasswordSetup();
  }

  return (
    <Screen icon={<LockKeyhole className="size-7" />} title="تعيين كلمة المرور">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
          <Input id="new-password" type="password" dir="ltr" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
          <Input id="confirm-password" type="password" dir="ltr" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" variant="gold" size="lg" className="w-full" disabled={busy}>
          {busy ? "جارٍ الحفظ…" : "حفظ ومتابعة"}
        </Button>
      </form>
    </Screen>
  );
}

function DeniedScreen() {
  const { signOut } = useAuth();
  return (
    <Screen icon={<ShieldAlert className="size-7" />} title="لا يوجد وصول">
      <p className="mb-6 text-center text-sm leading-relaxed text-muted-foreground">
        هذا الحساب غير مفعّل أو لا يملك صلاحية الدخول. تواصل مع مدير النظام.
      </p>
      <Button variant="outline" className="w-full" onClick={() => void signOut()}>
        تسجيل الخروج
      </Button>
    </Screen>
  );
}

/** لا يُعرض أي محتوى من التطبيق إلا بعد التحقق من الدخول والصلاحية. */
export function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  if (status === "loading") {
    return <main className="grid min-h-screen place-items-center bg-background text-muted-foreground">جارٍ التحميل…</main>;
  }
  if (status === "signedOut") return <LoginScreen />;
  if (status === "needsPassword") return <SetPasswordScreen />;
  if (status === "denied") return <DeniedScreen />;
  return <>{children}</>;
}
