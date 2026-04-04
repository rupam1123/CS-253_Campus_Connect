const USER_KEY = "user";
const TOKEN_KEY = "token";
const ROLE_KEY = "role";

function getStorage() {
 if (typeof window === "undefined") {
  return null;
 }

 return window.localStorage;
}

function readStoredJson(key, fallback = null) {
 const storage = getStorage();

 if (!storage) {
  return fallback;
 }

 const rawValue = storage.getItem(key);

 if (!rawValue) {
  return fallback;
 }

 try {
  return JSON.parse(rawValue);
 } catch (error) {
  console.warn(`Unable to parse localStorage item "${key}".`, error);
  storage.removeItem(key);
  return fallback;
 }
}

export function getStoredUser() {
 return readStoredJson(USER_KEY, null);
}

export function getStoredToken() {
 const storage = getStorage();
 return storage?.getItem(TOKEN_KEY) || "";
}

export function getStoredRole() {
 const storage = getStorage();
 const user = getStoredUser();
 const storedRole = storage?.getItem(ROLE_KEY);

 return (storedRole || user?.role || "").toLowerCase();
}

export function isAuthenticated() {
 const storage = getStorage();
 return Boolean(storage?.getItem(TOKEN_KEY) && getStoredUser());
}

export function persistSession({ token, user }) {
 const storage = getStorage();

 if (!storage) {
  return;
 }

 if (token) {
  storage.setItem(TOKEN_KEY, token);
 }

 if (user) {
  storage.setItem(USER_KEY, JSON.stringify(user));
  storage.setItem(ROLE_KEY, (user.role || "").toLowerCase());
 }
}

export function clearSession() {
 const storage = getStorage();

 if (!storage) {
  return;
 }

 storage.removeItem(TOKEN_KEY);
 storage.removeItem(USER_KEY);
 storage.removeItem(ROLE_KEY);
}

export function getDefaultDashboardPath(role = getStoredRole()) {
 return role === "student" ? "/student-dashboard" : "/professor-dashboard";
}
