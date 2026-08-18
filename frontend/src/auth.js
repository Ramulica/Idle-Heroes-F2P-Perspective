import { createContext, useContext } from "react";

export const GUEST_USER = { id: null, username: "Guest", guest: true };
export const GUEST_KEY = "ih-guest";
export const GUEST_SG_KEY = "ih-guest-sg";

export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function isGuestUser(user) {
  return Boolean(user?.guest);
}
