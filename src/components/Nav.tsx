"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { isLoggedIn, isAdmin, removeToken } from "@/lib/auth";

export default function Nav() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [loggedIn, setLoggedIn] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const update = () => {
      setLoggedIn(isLoggedIn());
      setAdmin(isAdmin());
    };
    update();
    window.addEventListener("authChange", update);
    return () => window.removeEventListener("authChange", update);
  }, []);

  const logout = () => {
    removeToken();
    router.push("/");
  };

  const isDark = theme === "dark";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b px-6 py-4 dark:bg-[#0a0a0a]/90 dark:border-white/[0.06] bg-white/90 border-slate-200">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm font-mono font-bold tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors uppercase"
        >
          clips<span className="text-cyan-400">.</span>dgesy
        </button>

        <div className="flex items-center gap-3">
          {loggedIn ? (
            <>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-4 py-2 text-sm dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                My Clips
              </button>
              <button
                onClick={() => router.push("/account")}
                className="px-4 py-2 text-sm dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                Account
              </button>
              {admin && (
                <button
                  onClick={() => router.push("/admin")}
                  className="px-4 py-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Admin
                </button>
              )}
              <button
                onClick={logout}
                className="px-4 py-2 text-sm rounded-xl border dark:border-white/[0.08] border-slate-200 dark:bg-white/[0.03] bg-slate-100 dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-slate-100 transition-all"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push("/login")}
                className="px-4 py-2 text-sm dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => router.push("/register")}
                className="px-4 py-2 text-sm rounded-xl font-medium text-white transition-all"
                style={{ background: "linear-gradient(135deg, #6366f1, #06b6d4)" }}
              >
                Sign Up
              </button>
            </>
          )}

          {mounted && (
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="p-2 rounded-xl border dark:border-white/[0.08] border-slate-200 dark:text-slate-400 text-slate-600 hover:text-indigo-400 transition-all"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}