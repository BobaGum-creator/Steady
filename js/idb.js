/**
 * Steady - IndexedDB Backup Layer
 * Mirrors critical data to IndexedDB as async backup
 * @module idb
 */

const DB_NAME = 'steady-backup';
const DB_VERSION = 1;
const STORES = ['sessions', 'journal', 'reflections', 'checkins'];

let dbInstance = null;

/**
 * Initialize IndexedDB connection
 * Creates object stores if needed
 * @returns {Promise<IDBDatabase>} Database instance
 */
export function initDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB open error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      STORES.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      });
    };
  });
}

/**
 * Backup sessions to IndexedDB
 * @param {Array<Object>} sessions - Sessions array
 * @returns {Promise<void>}
 */
export async function backupSessions(sessions) {
  try {
    const db = await initDB();
    const tx = db.transaction('sessions', 'readwrite');
    const store = tx.objectStore('sessions');

    // Clear existing sessions
    await new Promise((resolve, reject) => {
      const clearReq = store.clear();
      clearReq.onsuccess = resolve;
      clearReq.onerror = reject;
    });

    // Add new sessions with IDs
    sessions.forEach((session, index) => {
      const sessionWithId = {
        id: session.id || `session_${index}_${Date.now()}`,
        ...session,
      };
      store.add(sessionWithId);
    });

    return new Promise((resolve, reject) => {
      tx.onsuccess = resolve;
      tx.onerror = reject;
    });
  } catch (e) {
    console.error('Failed to backup sessions:', e);
  }
}

/**
 * Backup journal entries to IndexedDB
 * @param {Array<Object>} entries - Journal entries array
 * @returns {Promise<void>}
 */
export async function backupJournal(entries) {
  try {
    const db = await initDB();
    const tx = db.transaction('journal', 'readwrite');
    const store = tx.objectStore('journal');

    // Clear existing entries
    await new Promise((resolve, reject) => {
      const clearReq = store.clear();
      clearReq.onsuccess = resolve;
      clearReq.onerror = reject;
    });

    // Add new entries with IDs
    entries.forEach((entry, index) => {
      const entryWithId = {
        id: entry.id || `journal_${index}_${Date.now()}`,
        ...entry,
      };
      store.add(entryWithId);
    });

    return new Promise((resolve, reject) => {
      tx.onsuccess = resolve;
      tx.onerror = reject;
    });
  } catch (e) {
    console.error('Failed to backup journal:', e);
  }
}

/**
 * Backup reflections to IndexedDB
 * @param {Array<Object>} reflections - Reflections array
 * @returns {Promise<void>}
 */
export async function backupReflections(reflections) {
  try {
    const db = await initDB();
    const tx = db.transaction('reflections', 'readwrite');
    const store = tx.objectStore('reflections');

    // Clear existing reflections
    await new Promise((resolve, reject) => {
      const clearReq = store.clear();
      clearReq.onsuccess = resolve;
      clearReq.onerror = reject;
    });

    // Add new reflections with IDs
    reflections.forEach((reflection, index) => {
      const reflectionWithId = {
        id: reflection.id || `reflection_${index}_${Date.now()}`,
        ...reflection,
      };
      store.add(reflectionWithId);
    });

    return new Promise((resolve, reject) => {
      tx.onsuccess = resolve;
      tx.onerror = reject;
    });
  } catch (e) {
    console.error('Failed to backup reflections:', e);
  }
}

/**
 * Backup check-ins to IndexedDB
 * @param {Array<Object>} checkins - Check-ins array
 * @returns {Promise<void>}
 */
export async function backupCheckIns(checkins) {
  try {
    const db = await initDB();
    const tx = db.transaction('checkins', 'readwrite');
    const store = tx.objectStore('checkins');

    // Clear existing check-ins
    await new Promise((resolve, reject) => {
      const clearReq = store.clear();
      clearReq.onsuccess = resolve;
      clearReq.onerror = reject;
    });

    // Add new check-ins with IDs
    checkins.forEach((checkin, index) => {
      const checkinWithId = {
        id: checkin.id || `checkin_${index}_${Date.now()}`,
        ...checkin,
      };
      store.add(checkinWithId);
    });

    return new Promise((resolve, reject) => {
      tx.onsuccess = resolve;
      tx.onerror = reject;
    });
  } catch (e) {
    console.error('Failed to backup check-ins:', e);
  }
}

/**
 * Restore all data from IndexedDB backup
 * Used when localStorage is empty
 * @returns {Promise<Object>} All backed up data
 */
export async function restoreFromBackup() {
  try {
    const db = await initDB();
    const restoredData = {
      sessions: [],
      journal: [],
      reflections: [],
      checkins: [],
    };

    // Restore each store
    for (const storeName of STORES) {
      restoredData[storeName] = await new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const getAllReq = store.getAll();

        getAllReq.onsuccess = () => {
          resolve(getAllReq.result || []);
        };

        getAllReq.onerror = reject;
      });
    }

    return restoredData;
  } catch (e) {
    console.error('Failed to restore from backup:', e);
    return {
      sessions: [],
      journal: [],
      reflections: [],
      checkins: [],
    };
  }
}

/**
 * Get backup stats (how much data is stored)
 * @returns {Promise<Object>} {storeName: count}
 */
export async function getBackupStats() {
  try {
    const db = await initDB();
    const stats = {};

    for (const storeName of STORES) {
      stats[storeName] = await new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const countReq = store.count();

        countReq.onsuccess = () => {
          resolve(countReq.result);
        };

        countReq.onerror = reject;
      });
    }

    return stats;
  } catch (e) {
    console.error('Failed to get backup stats:', e);
    return {};
  }
}

/**
 * Clear all IndexedDB data
 * @returns {Promise<void>}
 */
export async function clearBackup() {
  try {
    const db = await initDB();

    for (const storeName of STORES) {
      await new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const clearReq = store.clear();

        clearReq.onsuccess = resolve;
        clearReq.onerror = reject;
      });
    }
  } catch (e) {
    console.error('Failed to clear backup:', e);
  }
}

/**
 * Sync helper - call this after saving data to localStorage
 * Automatically backs up critical data to IndexedDB
 * @param {Object} options - {sessions, journal, reflections, checkins}
 * @returns {Promise<void>}
 */
export async function syncBackup(options = {}) {
  try {
    if (options.sessions) {
      await backupSessions(options.sessions);
    }
    if (options.journal) {
      await backupJournal(options.journal);
    }
    if (options.reflections) {
      await backupReflections(options.reflections);
    }
    if (options.checkins) {
      await backupCheckIns(options.checkins);
    }
  } catch (e) {
    console.error('Sync backup failed:', e);
  }
}
