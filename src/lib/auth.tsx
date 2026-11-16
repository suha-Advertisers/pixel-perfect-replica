import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

/**
 * حالة الدخول والصلاحيات.
 * الحماية الحقيقية في قاعدة البيانات (RLS)؛ هذه الطبقة تتحكم بما تعرضه الواجهة فقط.
 */
export type AuthStatus = "loading" | "signedOut" | "needsPassword" | "denied" | "ready";

type AuthContextValue = {
  status: AuthStatus;
  session: Session | null;
  email: string | null;
  can: (permission: string) => boolean;
  signOut: () => Promise<void>;
  completePasswordSetup: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// نلتقط الرابط قبل أن يستهلكه Supabase: روابط الدعوة وإعادة التعيين تحتاج شاشة كلمة مرور.
const initialHash = typeof window !== "undefined" ? window.location.hash : "";
const arrivedViaInviteLink = /(^|[#&])type=(invite|recovery)(&|$)/.test(initialHash);

const IDLE_LIMIT_MS = 30 * 60 * 1000; // خروج تلقائي بعد 30 دقيقة بلا نشاط

type Access = { status: "loading" | "signedOut" | "denied" | "ready"; session: Session | null; permissions: ReadonlySet<string> };
const EMPTY: ReadonlySet<string> = new Set();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [access, setAccess] = useState<Access>({ status: "loading", session: null, permissions: EMPTY });
  const [needsPassword, setNeedsPassword] = useState(arrivedViaInviteLink);

  useEffect(() => {
    let cancelled = false;

    async function load(session: Session | null) {
      if (!session) {
        if (!cancelled) setAccess({ status: "signedOut", session: null, permissions: EMPTY });
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_active")
        .eq("id", session.user.id)
        .maybeSingle();
      if (!profile || !profile.is_active) {
        if (!cancelled) setAccess({ status: "denied", session, permissions: EMPTY });
        return;
      }
      const { data: perms, error } = await supabase.rpc("get_my_permissions");
      if (cancelled) return;
      if (error) {
        setAccess({ status: "denied", session, permissions: EMPTY });
        return;
      }
      setAccess({ status: "ready", session, permissions: new Set(perms ?? []) });
    }

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setNeedsPassword(true);
      // لا نستدعي Supabase مباشرة داخل المستمع لتفادي التعليق.
      setTimeout(() => {
        if (!cancelled) void load(session);
      }, 0);
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  // إنهاء الجلسة تلقائياً عند الخمول.
  useEffect(() => {
    if (access.status !== "ready") return;
    let last = Date.now();
    const touch = () => {
      last = Date.now();
    };
    const events = ["mousemove", "keydown", "click", "touchstart", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    const timer = window.setInterval(() => {
      if (Date.now() - last > IDLE_LIMIT_MS) void supabase.auth.signOut();
    }, 60_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, touch));
      window.clearInterval(timer);
    };
  }, [access.status]);

  const completePasswordSetup = useCallback(() => {
    setNeedsPassword(false);
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const status: AuthStatus =
      access.status === "ready" && needsPassword ? "needsPassword" : access.status;
    return {
      status,
      session: access.session,
      email: access.session?.user.email ?? null,
      can: (permission: string) => access.permissions.has(permission),
      signOut,
      completePasswordSetup,
    };
  }, [access, needsPassword, signOut, completePasswordSetup]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
