// src/audit.js
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Write a single audit event.
 * @param {object} params
 * @param {string} params.event  - EVENT_TYPE constant (see below)
 * @param {string} params.uid    - actor uid
 * @param {string} params.name   - actor display name
 * @param {object} [params.meta] - extra data (matchId, before/after, etc.)
 */
export async function audit({ event, uid, name, meta = {} }) {
  try {
    await addDoc(collection(db, "audit"), {
      event,
      actorUid:  uid,
      actorName: name,
      meta,
      ts: serverTimestamp(),
    });
  } catch (err) {
    // Silent – audit failure must never break normal flow
    console.warn("[AUDIT] failed to write:", err);
  }
}

export const AuditEvent = {
  USER_REGISTERED:   "USER_REGISTERED",
  USER_LOGIN:        "USER_LOGIN",
  PROFILE_UPDATED:   "PROFILE_UPDATED",
  MATCH_CREATED:     "MATCH_CREATED",
  MATCH_EDITED:      "MATCH_EDITED",
};
