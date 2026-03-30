// src/elo.js
const K = 32;
const expected = (a, b) => 1 / (1 + Math.pow(10, (b - a) / 400));

export function newElo(rating, oppAvg, win) {
  return Math.round(rating + K * ((win ? 1 : 0) - expected(rating, oppAvg)));
}

export function computeMatchElo(team1, team2, winnerTeam) {
  const avg = (t) => t.reduce((s, p) => s + p.elo, 0) / t.length;
  const avg1 = avg(team1), avg2 = avg(team2);
  const result = {};
  team1.forEach((p) => {
    if (p.isGuest) return;
    const next = newElo(p.elo, avg2, winnerTeam === 1);
    result[p.uid] = { elo: next, delta: next - p.elo };
  });
  team2.forEach((p) => {
    if (p.isGuest) return;
    const next = newElo(p.elo, avg1, winnerTeam === 2);
    result[p.uid] = { elo: next, delta: next - p.elo };
  });
  return result;
}

export function getTier(elo) {
  if (elo >= 1400) return { label: "DIAMANTE", color: "#0891b2", bg: "#ecfeff", glow: "rgba(8,145,178,0.2)" };
  if (elo >= 1250) return { label: "PLATINO",  color: "#7c3aed", bg: "#f5f3ff", glow: "rgba(124,58,237,0.2)" };
  if (elo >= 1100) return { label: "ORO",      color: "#b45309", bg: "#fef3c7", glow: "rgba(180,83,9,0.2)"   };
  if (elo >= 950)  return { label: "PLATA",    color: "#475569", bg: "#f1f5f9", glow: "rgba(71,85,105,0.2)"  };
  return                   { label: "BRONCE",  color: "#92400e", bg: "#fef3c7", glow: "rgba(146,64,14,0.2)"  };
}

export function formatSets(sets) {
  if (!sets || !sets.length) return "";
  return sets.map(([a, b]) => `${a}-${b}`).join("  ");
}

export function setsWinner(sets) {
  let w1 = 0, w2 = 0;
  (sets || []).forEach(([a, b]) => { if (a > b) w1++; else if (b > a) w2++; });
  if (w1 > w2) return 1;
  if (w2 > w1) return 2;
  return null;
}
