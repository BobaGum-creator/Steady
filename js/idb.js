/**
 * IndexedDB module for Steady — durable, high-capacity storage layer
 *
 * Provides async persistence alongside localStorage. The storage module
 * uses localStorage for synchronous reads and writes through to IndexedDB
 * for durability and larger quota (~50MB+ vs localStorage's ~5-10MB).
 *
 * Object stores mirror the localStorage key structure:
 *   - settings: single record (key: 'settings')
 *   - checkins: keyed by date string (YYYY-MM-DD)
 *   - sessions: keyed by timestamp
 *   - journal:  keyed by timestamp
 *   - favorites: single record (key: 'favorites')
 */

const DB_NAME = 'steady';
const DB_VERSION = 1;
const STORES = ['settings', 'checkins', 'sessions', 'journal', 'favorites'];

let dbPromise = null;

/**
 * Opens (or creates) the IndexedDB database
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      STORES.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

/**
 * Performs a single put operation on a store
 * @param {string} storeName - Object store name
 * @param {string} key - Record key
 * @param {any} value - Value to store
 * @returns {Promise<void>}
 */
export async function put(storeName, key, value) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IDB put failed:', err.message);
  }
}

/**
 * Gets a single record from a store
 * @param {string} storeName - Object store name
 * @param {string} key - Record key
 * @returns {Promise<any|undefined>}
 */
export async function get(storeName, key) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const request = tx.objectStore(storeName).get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IDB get failed:', err.message);
    return undefined;
  }
}

/**
 * Gets all records from a store
 * @param {string} storeName - Object store name
 * @returns {Promise<Array<{key: string, value: any}>>}
 */
export async function getAll(storeName) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const results = [];

      const cursorReq = store.openCursor();
      cursorReq.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          results.push({ key: cursor.key, value: cursor.value });
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      cursorReq.onerror = () => reject(cursorReq.error);
    });
  } catch (err) {
    console.warn('IDB getAll failed:', err.message);
    return [];
  }
}

/**
 * Deletes a single record from a store
 * @param {string} storeName - Object store name
 * @param {string} key - Record key
 * @returns {Promise<void>}
 */
export async function remove(storeName, key) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IDB remove failed:', err.message);
  }
}

/**
 * Clears all records from all Steady stores
 * @returns {Promise<void>}
 */
export async function clearAll() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES, 'readwrite');
      STORES.forEach((storeName) => {
        tx.objectStore(storeName).clear();
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IDB clearAll failed:', err.message);
  }
}

/**
 * Bulk puts multiple records into a store in a single transaction
 * @param {string} storeName - Object store name
 * @param {Array<{key: string, value: any}>} records - Records to store
 * @returns {Promise<void>}
 */
export async function putBatch(storeName, records) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      records.forEach(({ key, value }) => {
        store.put(value, key);
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IDB putBatch failed:', err.message);
  }
}

/**
 * Hydrates localStorage from IndexedDB on startup.
 * Only writes to localStorage keys that don't already exist,
 * so localStorage edits are preserved if IDB is stale.
 * @param {string} prefix - The localStorage key prefix (e.g. 'steady_')
 * @returns {Promise<number>} Number of keys hydrated
 */
export async function hydrateFromIDB(prefix) {
  let hydrated = 0;
  try {
    // Settings
    const settings = await get('settings', 'settings');
    if (settings && !localStorage.getItem(`${prefix}settings`)) {
      localStorage.setItem(`${prefix}settings`, JSON.stringify(settings));
      hydrated++;
    }

    // Favorites
    const favorites = await get('favorites', 'favorites');
    if (favorites && !localStorage.getItem(`${prefix}favorites`)) {
      localStorage.setItem(`${prefix}favorites`, JSON.stringify(favorites));
      hydrated++;
    }

    // Check-ins
    const checkins = await getAll('checkins');
    checkins.forEach(({ key, value }) => {
      const lsKey = `${prefix}checkin_${key}`;
      if (!localStorage.getItem(lsKey)) {
        localStorage.setItem(lsKey, JSON.stringify(value));
        hydrated++;
      }
    });

    // Sessions
    const sessions = await getAll('sessions');
    sessions.forEach(({ key, value }) => {
      const lsKey = `${prefix}session_${key}`;
      if (!localStorage.getItem(lsKey)) {
        localStorage.setItem(lsKey, JSON.stringify(value));
        hydrated++;
      }
    });

    // Journal
    const journalEntries = await getAll('journal');
    journalEntries.forEach(({ key, value }) => {
      const lsKey = `${prefix}journal_${key}`;
      if (!localStorage.getItem(lsKey)) {
        localStorage.setItem(lsKey, JSON.stringify(value));
        hydrated++;
      }
    });
  } catch (err) {
    console.warn('IDB hydration failed:', err.message);
  }
  return hydrated;
}

/**
 * Syncs all localStorage data into IndexedDB (initial migration).
 * Call once on first load to seed IDB from any existing localStorage data.
 * @param {string} prefix - The localStorage key prefix
 * @returns {Promise<number>} Number of keys synced
 */
export async function syncToIDB(prefix) {
  let synced = 0;
  try {
    const checkinRecords = [];
    const sessionRecords = [];
    const journalRecords = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(prefix)) continue;

      const cleanKey = key.substring(prefix.length);
      const value = JSON.parse(localStorage.getItem(key));

      if (cleanKey === 'settings') {
        await put('settings', 'settings', value);
        synced++;
      } else if (cleanKey === 'favorites') {
        await put('favorites', 'favorites', value);
        synced++;
      } else if (cleanKey.startsWith('checkin_')) {
        const dateKey = cleanKey.substring('checkin_'.length);
        checkinRecords.push({ key: dateKey, value });
      } else if (cleanKey.startsWith('session_')) {
        const tsKey = cleanKey.substring('session_'.length);
        sessionRecords.push({ key: tsKey, value });
      } else if (cleanKey.startsWith('journal_')) {
        const tsKey = cleanKey.substring('journal_'.length);
        journalRecords.push({ key: tsKey, value });
      }
    }

    if (checkinRecords.length > 0) {
      await putBatch('checkins', checkinRecords);
      synced += checkinRecords.length;
    }
    if (sessionRecords.length > 0) {
      await putBatch('sessions', sessionRecords);
      synced += sessionRecords.length;
    }
    if (journalRecords.length > 0) {
      await putBatch('journal', journalRecords);
      synced += journalRecords.length;
    }
  } catch (err) {
    console.warn('IDB sync failed:', err.message);
  }
  return synced;
}

/**
 * Check if IndexedDB is available and working
 * @returns {Promise<boolean>}
 */
export async function isAvailable() {
  try {
    await openDB();
    return true;
  } catch {
    return false;
  }
}
