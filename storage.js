export const StorageKeys = {
    DARK_MODE: 'darkMode',
    EXAM_PROGRESS: 'examProgress'
};

export function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error(`Error saving to localStorage (${key}):`, error);
    }
}

export function loadFromStorage(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        console.error(`Error loading from localStorage (${key}):`, error);
        return null;
    }
}

export function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error(`Error removing from localStorage (${key}):`, error);
    }
}

export function saveExamProgress(progress) {
    saveToStorage(StorageKeys.EXAM_PROGRESS, progress);
}

export function loadExamProgress() {
    return loadFromStorage(StorageKeys.EXAM_PROGRESS);
}

export function clearExamProgress() {
    removeFromStorage(StorageKeys.EXAM_PROGRESS);
}

export function getDarkMode() {
    return loadFromStorage(StorageKeys.DARK_MODE) === true;
}

export function setDarkMode(enabled) {
    saveToStorage(StorageKeys.DARK_MODE, enabled);
}