// =========================================================================
// STOCKAGE DE SESSION SÉCURISÉ
// En cas d'échec (stockage désactivé, navigation privée restrictive, quota
// dépassé…), le site continue de fonctionner : safeGet renvoie null et
// safeSet ne fait rien (no-op).
// =========================================================================

export function safeGet(key) {
  try {
    return sessionStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

export function safeSet(key, val) {
  try {
    sessionStorage.setItem(key, val);
  } catch (e) {
    // Échec silencieux volontaire : le cache de session est optionnel.
  }
}
