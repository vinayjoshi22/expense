/// <reference types="gapi" />
/// <reference types="gapi.client.drive" />

declare global {
    interface Window {
        google: any;
    }
    interface Window {
        google: any;
    }
    var google: any;
}

export interface GoogleDriveConfig {
    clientId: string;
}

// Scopes for App Data folder
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const BACKUP_FILENAME = 'expense_analyzer_backup.json';

let tokenClient: any | null = null;
let gapiInited = false;
let gisInited = false;

export const loadGoogleScripts = (callback: () => void) => {
    const script1 = document.createElement('script');
    script1.src = 'https://apis.google.com/js/api.js';
    script1.async = true;
    script1.defer = true;
    script1.onload = () => {
        gapi.load('client', async () => {
            await gapi.client.init({
                discoveryDocs: DISCOVERY_DOCS,
            });
            gapiInited = true;
            if (gisInited) callback();
        });
    };
    document.body.appendChild(script1);

    const script2 = document.createElement('script');
    script2.src = 'https://accounts.google.com/gsi/client';
    script2.async = true;
    script2.defer = true;
    script2.onload = () => {
        gisInited = true;
        if (gapiInited) callback();
    };
    document.body.appendChild(script2);
};

export const initGoogleAuth = (clientId: string, onTokenCallback: (res: any) => void) => {
    appTokenCallback = onTokenCallback;
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: handleTokenResponse, // Use our internal wrapper
    });
};

export const requestAccessToken = () => {
    if (tokenClient) {
        // Force prompt if no token or expired? Usually just auto-refresh if possible, but for simple flow:
        tokenClient.requestAccessToken({ prompt: '' });
    }
};

export const revokeAccessToken = () => {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token, () => { });
        gapi.client.setToken(null);
    }
}

// Ensure valid token (trigger prompt if needed, mainly for when session restored but token expired)
const ensureToken = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        const token = gapi.client.getToken();
        // If we have a token, assume it's valid for now (or let API fail then retry? simpler to just trust existence for check)
        // Better: checking expiration is hard with just implicit flow sometimes, but we can assume if it's there it might work.
        // However, if we persisted "connected" but reloaded, token is NULL.
        if (token !== null) {
            resolve();
            return;
        }

        // No token, but we are supposed to be connected. Request one.
        // Since we are inside an async operation triggered by user, a popup is okay if needed.
        if (!tokenClient) {
            reject(new Error("Google Auth not initialized"));
            return;
        }

        // We need to temporarily override the callback to capture this specific request's success
        // But tokenClient callback is global. 
        // Strategy: Use a requestAccessToken wrapper that handles the callback one-off or use the global one to resolve a pending promise?
        // Simpler approach for this app: 
        // `tokenClient.requestAccessToken` creates a token. 
        // We can't await it directly.
        // We can upgrade `requestAccessToken` to return a promise, but it relies on the callback passed to `initTokenClient`.

        // Actually, let's just fail if strictly no token in a way App.tsx handles? 
        // No, user wants it seamless.

        // Let's rely on standard GIS flow:
        // We can't easily promisify `requestAccessToken` without changing how we init.
        // Let's change `initGoogleAuth` to not rely on a single callback closure if we want dynamic.
        // OR, easier: just fail and tell user "Please reconnect".
        // BUT user asked for "persistent".

        // Correct fix: When `tokenClient.requestAccessToken` is called, the callback defined in `initTokenClient` fires.
        // We need that callback to resolve OUR promise.

        // Let's Hack/Fix: Re-init token client with a custom callback for this one request? No, expensive.
        // Let's use a global/module level resolver.

        pendingTokenResolve = resolve;
        pendingTokenReject = reject;
        tokenClient.requestAccessToken({ prompt: '' }); // Try silent first? or just '' which often skips if consented.
    });
};

let pendingTokenResolve: (() => void) | null = null;
let pendingTokenReject: ((err: any) => void) | null = null;

// Wrap the original callback to handle pending promises
const handleTokenResponse = (res: any) => {
    if (res && res.access_token) {
        gapi.client.setToken(res); // Store the token!
        if (pendingTokenResolve) {
            pendingTokenResolve();
            pendingTokenResolve = null;
            pendingTokenReject = null;
        }
        // Also call the original app callback if we want to update UI state, 
        // but currently App.tsx manages state via `initGoogleAuth` callback.
        // We should chain them.
        if (appTokenCallback) appTokenCallback(res);
    } else {
        if (pendingTokenReject) {
            pendingTokenReject(res);
            pendingTokenResolve = null;
            pendingTokenReject = null;
        }
    }
};

let appTokenCallback: ((res: any) => void) | null = null;


// --- Drive Operations ---

export const findBackupFile = async (): Promise<string | null> => {
    try {
        const response = await gapi.client.drive.files.list({
            spaces: 'appDataFolder',
            q: `name = '${BACKUP_FILENAME}' and trashed = false`,
            fields: 'files(id, name, modifiedTime)',
            pageSize: 1
        });
        const files = response.result.files;
        if (files && files.length > 0) {
            return files[0].id || null; // Return ID of existing file
        }
        return null;
    } catch (err) {
        console.error("Error finding backup file:", err);
        throw err;
    }
};

export const uploadBackup = async (data: any, isRetry = false): Promise<{ id: string, time: string }> => {
    try {
        await ensureToken();
        const fileContent = JSON.stringify(data);
        const fileId = await findBackupFile();

        const metadata = {
            name: BACKUP_FILENAME,
            mimeType: 'application/json',
            parents: !fileId ? ['appDataFolder'] : undefined // Only set parent on creation
        } as any;

        const multipartRequestBody =
            `\r\n--foo_bar_baz\r\n` +
            `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
            JSON.stringify(metadata) +
            `\r\n--foo_bar_baz\r\n` +
            `Content-Type: application/json\r\n\r\n` +
            fileContent +
            `\r\n--foo_bar_baz--`;

        let response;
        if (fileId) {
            // Update existing file
            response = await gapi.client.request({
                path: `/upload/drive/v3/files/${fileId}`,
                method: 'PATCH',
                params: { uploadType: 'multipart' },
                headers: { 'Content-Type': 'multipart/related; boundary=foo_bar_baz' },
                body: multipartRequestBody
            });
        } else {
            // Create new file
            response = await gapi.client.request({
                path: '/upload/drive/v3/files',
                method: 'POST',
                params: { uploadType: 'multipart' },
                headers: { 'Content-Type': 'multipart/related; boundary=foo_bar_baz' },
                body: multipartRequestBody
            });
        }
        return {
            id: response.result.id,
            time: new Date().toISOString()
        };
    } catch (err: any) {
        if (!isRetry && (err.status === 401 || err.result?.error?.code === 401)) {
            console.log("Token expired, refreshing...");
            gapi.client.setToken(null);
            return uploadBackup(data, true);
        }
        console.error("Error uploading backup:", err);
        throw err;
    }
};

export const downloadBackup = async (isRetry = false): Promise<any> => {
    try {
        await ensureToken();
        const fileId = await findBackupFile();
        if (!fileId) throw new Error("No backup found.");

        const response = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media'
        });
        return response.result; // Should be the JSON object
    } catch (err: any) {
        if (!isRetry && (err.status === 401 || err.result?.error?.code === 401)) {
            console.log("Token expired, refreshing...");
            gapi.client.setToken(null);
            return downloadBackup(true);
        }
        console.error("Error downloading backup:", err);
        throw err;
    }
};

// Check if we have a valid token currently loaded in gapi
export const checkToken = (): boolean => {
    return gapi.client.getToken() !== null;
};
