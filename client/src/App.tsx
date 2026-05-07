import { Routes, Route } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import RavenApp from "./pages/raven/RavenApp";
import DaedalusStub from "./pages/stubs/DaedalusStub";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import ResetPassword from "./pages/ResetPassword";

const SESSION_KEY = "ajr_session_token";
const AUTO_LOGOUT_KEY = "ajr_auto_logout";
const INACTIVITY_MS = 10 * 60 * 1000;

export interface BrandData {
  displayName: string | null;
  spaceName: string | null;
  logoPath: string | null;
  brandLogoPath: string | null;
}

type AuthState = "loading" | "login" | "onboarding" | "authed" | "reset-password";

export default function App() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [brand, setBrand] = useState<BrandData | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getToken = () => localStorage.getItem(SESSION_KEY) ?? "";
  const isAutoLogout = () => localStorage.getItem(AUTO_LOGOUT_KEY) !== "false";

  const doLogout = useCallback(async () => {
    const token = getToken();
    if (token) {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "x-session-token": token },
      }).catch(() => {});
    }
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(AUTO_LOGOUT_KEY);
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    setAuthState("login");
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (!isAutoLogout()) return;
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(doLogout, INACTIVITY_MS);
  }, [doLogout]);

  useEffect(() => {
    if (authState !== "authed") return;
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"] as const;
    const handler = () => resetInactivityTimer();
    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    resetInactivityTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [authState, resetInactivityTimer]);

  const fetchBrand = async () => {
    try {
      const data = await fetch("/api/onboarding/state").then(r => r.json());
      setBrand({
        displayName: data.display_name || null,
        spaceName: data.space_name || null,
        logoPath: data.logo_path || null,
        brandLogoPath: data.brand_logo_path || null,
      });
    } catch { /* ignore */ }
  };

  const enterAuthed = async () => {
    await fetchBrand();
    setAuthState("authed");
  };

  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const tok = params.get("reset_token");
        if (tok) {
          setResetToken(tok);
          setAuthState("reset-password");
          return;
        }

        const statusRes = await fetch("/api/auth/setup-status");
        const { exists } = await statusRes.json();
        if (!exists) { setAuthState("onboarding"); return; }

        const token = getToken();
        if (!token) { setAuthState("login"); return; }

        const sessionRes = await fetch("/api/auth/session", {
          headers: { "x-session-token": token },
        });
        if (!sessionRes.ok) { setAuthState("login"); return; }

        const { autoLogout } = await sessionRes.json();
        localStorage.setItem(AUTO_LOGOUT_KEY, String(autoLogout));
        await enterAuthed();
      } catch {
        setAuthState("login");
      }
    })();
  }, []);

  const handleLogin = async (token: string, autoLogout: boolean) => {
    localStorage.setItem(SESSION_KEY, token);
    localStorage.setItem(AUTO_LOGOUT_KEY, String(autoLogout));
    await enterAuthed();
  };

  const handleOnboardingComplete = async (token: string) => {
    localStorage.setItem(SESSION_KEY, token);
    localStorage.setItem(AUTO_LOGOUT_KEY, "true");
    await enterAuthed();
  };

  if (authState === "loading") return <div style={{ minHeight: "100vh", background: "#0d0d0d" }} />;

  let content: React.ReactNode;

  if (authState === "reset-password" && resetToken) {
    content = <ResetPassword token={resetToken} onDone={() => { setResetToken(null); setAuthState("login"); }} />;
  } else if (authState === "login") {
    content = <Login onLogin={handleLogin} />;
  } else if (authState === "onboarding") {
    content = (
      <div style={{ position: "relative", minHeight: "100vh", background: "#0d0d0d" }}>
        <div className="brand-bg" style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: "url(/uploads/raven.png)", backgroundPosition: "center", backgroundRepeat: "no-repeat" }} />
        <div style={{ position: "fixed", inset: 0, zIndex: 1, background: "radial-gradient(ellipse at center, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.65) 65%, rgba(0,0,0,0.95) 100%)" }} />
        <div style={{ position: "relative", zIndex: 2 }}>
          <Onboarding onComplete={handleOnboardingComplete} onLogin={() => setAuthState("login")} />
        </div>
      </div>
    );
  } else {
    content = (
      <Routes>
        <Route path="/daedalus/*" element={<DaedalusStub />} />
        <Route path="/*" element={<RavenApp brand={brand} onBrandRefresh={fetchBrand} onLogout={doLogout} />} />
      </Routes>
    );
  }

  return content;
}
