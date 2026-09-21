const getStorage = (storageName = 'localStorage') => {
  if (typeof window === 'undefined') return null;

  try {
    const storage = window[storageName];
    if (!storage) return null;
    return storage;
  } catch {
    return null;
  }
};

const safeStorage = {
  getItem(key, storageName = 'localStorage') {
    const storage = getStorage(storageName);
    if (!storage) return null;

    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem(key, value, storageName = 'localStorage') {
    const storage = getStorage(storageName);
    if (!storage) return false;

    try {
      storage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },

  removeItem(key, storageName = 'localStorage') {
    const storage = getStorage(storageName);
    if (!storage) return false;

    try {
      storage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },

  getObject(key, storageName = 'localStorage') {
    const rawValue = this.getItem(key, storageName);
    if (!rawValue) return null;

    try {
      return JSON.parse(rawValue);
    } catch {
      return null;
    }
  },

  setObject(key, value, storageName = 'localStorage') {
    return this.setItem(key, JSON.stringify(value), storageName);
  }
};

export default safeStorage;
