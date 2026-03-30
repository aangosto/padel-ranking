// src/hooks/useAuth.jsx
import { useState, useEffect, createContext, useContext } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";
import { audit, AuditEvent } from "../audit";

const AuthContext = createContext(null);

async function ensureProfile(fbUser) {
  const ref  = doc(db, "users", fbUser.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const data = {
      uid:       fbUser.uid,
      name:      fbUser.displayName,
      email:     fbUser.email,
      photoURL:  fbUser.photoURL,
      elo:       1000,
      wins:      0,
      losses:    0,
      side:      null,
      paddle:    null,
      createdAt: serverTimestamp(),
    };
    await setDoc(ref, data);
    await audit({ event: AuditEvent.USER_REGISTERED, uid: fbUser.uid, name: fbUser.displayName });
    return data;
  }
  await audit({ event: AuditEvent.USER_LOGIN, uid: fbUser.uid, name: fbUser.displayName });
  return snap.data();
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(undefined);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) { setUser(null); setProfile(null); return; }
      const p = await ensureProfile(fbUser);
      setProfile(p);
      setUser(fbUser);
    });
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      alert("Popup bloqueado. Permite popups para este sitio e inténtalo de nuevo.");
    }
  };

  const logout = () => signOut(auth);

  const refreshProfile = async () => {
    if (!user) return;
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) setProfile(snap.data());
  };

  return (
    <AuthContext.Provider value={{ user, profile, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}