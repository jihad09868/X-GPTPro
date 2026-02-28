/**
 * Persistent Chat Storage using IndexedDB
 * Chat history survives browser reload, refresh, and even clearing localStorage.
 * Acts as a device-level cookie — data persists unless explicitly deleted.
 */

import { ChatSession } from '../types';

const DB_NAME = 'xgpt-chat-db';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    return dbPromise;
}

/** Save all sessions to IndexedDB */
export async function saveSessions(sessions: ChatSession[]): Promise<void> {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        // Clear old data and write fresh
        store.clear();
        for (const session of sessions) {
            store.put(session);
        }

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (e) {
        console.warn('IndexedDB save failed, falling back to localStorage', e);
        // Fallback: localStorage
        try {
            localStorage.setItem('deepseek-sessions', JSON.stringify(sessions));
        } catch { }
    }
}

/** Load all sessions from IndexedDB (falls back to localStorage) */
export async function loadSessions(): Promise<ChatSession[]> {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                const sessions = request.result as ChatSession[];
                // Sort by createdAt descending (newest first)
                sessions.sort((a, b) => b.createdAt - a.createdAt);
                resolve(sessions);
            };
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.warn('IndexedDB load failed, falling back to localStorage', e);
        // Fallback: localStorage
        try {
            const saved = localStorage.getItem('deepseek-sessions');
            if (saved) return JSON.parse(saved);
        } catch { }
        return [];
    }
}

/** Clear all sessions from IndexedDB */
export async function clearAllSessions(): Promise<void> {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).clear();
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (e) {
        console.warn('IndexedDB clear failed', e);
    }
    // Also clear localStorage fallback
    localStorage.removeItem('deepseek-sessions');
}

/**
 * Set a persistent device cookie that survives normal browsing.
 * Used for session identification and login persistence.
 */
export function setDeviceCookie(key: string, value: string, days: number = 365): void {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${key}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
    // Also store in localStorage as backup
    localStorage.setItem(key, value);
}

/** Get a device cookie value */
export function getDeviceCookie(key: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
    if (match) return decodeURIComponent(match[2]);
    // Fallback to localStorage
    return localStorage.getItem(key);
}

/** Remove a device cookie */
export function removeDeviceCookie(key: string): void {
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    localStorage.removeItem(key);
}
