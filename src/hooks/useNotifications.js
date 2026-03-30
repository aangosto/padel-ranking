// src/hooks/useNotifications.js
import { useState, useEffect } from "react";
import {
  collection, query, orderBy, onSnapshot,
  doc, updateDoc, addDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export function useNotifications(uid) {
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "notifications", uid, "items"),
      orderBy("ts", "desc")
    );
    return onSnapshot(q, (snap) => {
      setNotifs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [uid]);

  const unreadCount = notifs.filter((n) => !n.read).length;

  const markRead = async (notifId) => {
    await updateDoc(doc(db, "notifications", uid, "items", notifId), { read: true });
  };

  const markAllRead = async () => {
    await Promise.all(
      notifs.filter((n) => !n.read).map((n) =>
        updateDoc(doc(db, "notifications", uid, "items", n.id), { read: true })
      )
    );
  };

  return { notifs, unreadCount, markRead, markAllRead };
}

/**
 * Send a notification to a user.
 * Called from match create/edit flows.
 */
export async function sendNotification(toUid, { type, title, body, matchId }) {
  await addDoc(collection(db, "notifications", toUid, "items"), {
    type, title, body, matchId,
    read: false,
    ts: serverTimestamp(),
  });
}
