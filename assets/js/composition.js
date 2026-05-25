// ─── COMPOSITION & LAYOUT ENGINE ───────────────────────────────────────────

/**
 * Calcule la distance euclidienne entre deux points 2D.
 * C'est notre "Delta P" (Delta Pixel).
 */
export function getDistance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calcule le score basé sur le Delta P.
 * Un Delta P de 0 donne maxScore.
 * tolerance: distance maximum (en pixels) pour avoir 0 point.
 */
export function computePixelScore(deltaP, maxScore = 5000, tolerance = 100) {
  if (deltaP >= tolerance) return { score: 0, deltaP };
  
  // Exponentielle pour récompenser fortement la précision extrême
  // (deltaP=0 -> 1.0, deltaP=tolerance -> 0)
  const accuracy = Math.pow(1 - (deltaP / tolerance), 1.5);
  const score = Math.round(accuracy * maxScore);
  
  return { score, deltaP };
}

/**
 * Classement basé sur le pourcentage du score (0 à 1)
 */
export function getPixelRank(score, maxScore) {
  const pct = score / maxScore;
  if (pct >= 0.98) return { letter: 'S', label: 'PERFECTION', class: 'rank-s', emoji: '💎' };
  if (pct >= 0.90) return { letter: 'A', label: 'EXCELLENT', class: 'rank-a', emoji: '⭐' };
  if (pct >= 0.70) return { letter: 'B', label: 'BON', class: 'rank-b', emoji: '👍' };
  if (pct >= 0.40) return { letter: 'C', label: 'MOYEN', class: 'rank-c', emoji: '😐' };
  return { letter: 'F', label: 'A COTÉ', class: 'rank-f', emoji: '😵' };
}
