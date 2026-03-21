export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

export const setToken = (token: string): void => {
  localStorage.setItem("token", token);
};

export const removeToken = (): void => {
  localStorage.removeItem("token");
};

export const parseToken = (token: string) => {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

export const getRole = (): string | null => {
  const token = getToken();
  if (!token) return null;
  const parsed = parseToken(token);
  return parsed?.role || null;
};

export const isAdmin = (): boolean => {
  return getRole() === "ADMIN";
};

export const isLoggedIn = (): boolean => {
  const token = getToken();
  if (!token) return false;
  const parsed = parseToken(token);
  if (!parsed) return false;
  return parsed.exp * 1000 > Date.now();
};