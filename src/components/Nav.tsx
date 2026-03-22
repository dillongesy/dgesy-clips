"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn, isAdmin, removeToken } from "@/lib/auth";

export default function Nav() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/[0.06] px-6 py-4">
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
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-100 transition-colors"
              >
                My Clips
              </button>
              <button
                onClick={() => router.push("/shared")}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-100 transition-colors"
              >
                Shared
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
                className="px-4 py-2 text-sm rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-slate-100 transition-all"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push("/login")}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-100 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => router.push("/register")}
                className="px-4 py-2 text-sm rounded-xl font-medium text-white transition-all"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #06b6d4)",
                }}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}