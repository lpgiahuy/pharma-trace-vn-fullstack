import { AsyncLocalStorage } from 'async_hooks';

export const userContextStorage = new AsyncLocalStorage();

/**
 * Helper to get the current context user if set in the request scope.
 * @returns {{ id?: number|string, role?: string, don_vi_id?: number|string, type?: string } | null}
 */
export const getCurrentUserContext = () => {
    return userContextStorage.getStore() || null;
};
