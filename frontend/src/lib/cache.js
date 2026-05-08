/**
 * cache.js — Cache global em memória para chamadas à API
 *
 * Como funciona:
 * - Cada URL vira uma chave de cache
 * - Os dados ficam em memória por um TTL configurável
 * - Se os dados ainda estiverem válidos, retorna sem ir ao servidor
 * - Dados de admin têm TTL curto (30s) — mudam com mais frequência
 * - Dados públicos têm TTL médio (3min) — rankings, jogadores, torneios
 *
 * Uso:
 *   import { cachedGet, invalidateCache, invalidatePattern } from '../lib/cache';
 *   const data = await cachedGet(`${API}/players`, 180);
 */

const _store = {};

/**
 * Busca dado do cache SINCRONAMENTE. Retorna null se não existir ou expirado.
 * Use este para pré-popular o estado antes do fetch — sem await, sem travar a UI.
 */
export function getCached(url) {
  const entry = _store[url];
  if (!entry) return null;
  if (Date.now() - entry.ts > entry.ttl * 1000) {
    delete _store[url];
    return null;
  }
  return entry.data;
}

/**
 * Busca dado do cache internamente (privado).
 */
function _get(key) {
  const entry = _store[key];
  if (!entry) return null;
  if (Date.now() - entry.ts > entry.ttl * 1000) {
    delete _store[key];
    return null;
  }
  return entry.data;
}

/**
 * Salva dado no cache.
 */
function _set(key, data, ttlSeconds) {
  _store[key] = { data, ts: Date.now(), ttl: ttlSeconds };
}

/**
 * Faz GET com cache. Se o dado estiver em cache e válido, retorna sem chamar a API.
 * @param {string} url — URL completa da requisição
 * @param {number} ttlSeconds — tempo de vida em segundos (padrão: 180 = 3 minutos)
 * @param {object} axiosInstance — instância do axios (padrão: axios global)
 */
export async function cachedGet(url, ttlSeconds = 180, axiosInstance = null) {
  const cached = _get(url);
  if (cached !== null) return cached;

  // Importa axios dinamicamente para evitar dependência circular
  const ax = axiosInstance || (await import('./api')).default;
  const response = await ax.get(url);
  _set(url, response.data, ttlSeconds);
  return response.data;
}

/**
 * Invalida uma URL específica do cache.
 */
export function invalidateCache(url) {
  delete _store[url];
}

/**
 * Invalida todas as entradas cujas chaves contenham o padrão.
 * Ex: invalidatePattern('/players') invalida /players e /players/123/details
 */
export function invalidatePattern(pattern) {
  Object.keys(_store).forEach(key => {
    if (key.includes(pattern)) delete _store[key];
  });
}

/**
 * Limpa todo o cache. Útil após operações de escrita massivas.
 */
export function clearAllCache() {
  Object.keys(_store).forEach(key => delete _store[key]);
}

/**
 * TTLs recomendados por tipo de dado:
 *
 * PÚBLICO (muda raramente):
 *   rankings    → 300s (5 min) — backend já tem cache próprio
 *   players     → 180s (3 min)
 *   tournaments → 180s (3 min)
 *   theme       → 600s (10 min)
 *
 * ADMIN (muda com mais frequência):
 *   results     → 30s
 *   matches     → 30s
 *   players admin → 30s
 */
export const TTL = {
  RANKINGS: 300,
  PLAYERS: 180,
  TOURNAMENTS: 180,
  TOURNAMENT_DETAILS: 180,
  THEME: 600,
  ADMIN_SHORT: 30,
};
