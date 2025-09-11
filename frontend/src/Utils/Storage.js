// Storage.js

const Storage = (() => {
  // Private helper to stringify and handle errors
  const safeSet = (storage, key, value) => {
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error(`Error saving to storage[${key}]`, err);
    }
  };

  const safeGet = (storage, key) => {
    try {
      const value = storage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      console.error(`Error reading from storage[${key}]`, err);
      return null;
    }
  };

  return {
    /**
     * Save to both localStorage and sessionStorage
     */
    setStorageData(key, value) {
      safeSet(localStorage, key, value);
      safeSet(sessionStorage, key, value);
    },

    /**
     * Tries to fetch from sessionStorage first, then falls back to localStorage
     */
    getStorageData(key) {
      const sessionData = safeGet(sessionStorage, key);
      if (sessionData !== null) return sessionData;

      const localData = safeGet(localStorage, key);
      return localData;
    }
  };
})();

export default Storage;
