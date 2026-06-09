/**
 * Google Drive API Client
 *
 * Wraps the Google Drive API for file and folder operations.
 * Handles OAuth authentication, error handling, and retry logic.
 *
 * @see https://developers.google.com/drive/api/v3/reference
 */

import { google, drive_v3 } from 'googleapis';
import type { Credentials } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// Use 'any' for OAuth2Client due to version mismatches between google-auth-library versions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OAuth2ClientType = any;

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface GDriveConfig {
  credentialsPath?: string;  // Path to OAuth credentials JSON
  tokenPath?: string;        // Path to store tokens
  scopes?: string[];         // API scopes
}

export interface GDriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
}

export interface GDriveSearchResult {
  files: GDriveFile[];
  nextPageToken?: string;
}

// Default scopes for Drive access
const DEFAULT_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
];

// MIME types
export const MIME_TYPES = {
  FOLDER: 'application/vnd.google-apps.folder',
  DOCUMENT: 'application/vnd.google-apps.document',
  SPREADSHEET: 'application/vnd.google-apps.spreadsheet',
  TEXT: 'text/plain',
  MARKDOWN: 'text/markdown',
  JSON: 'application/json',
} as const;

/**
 * Custom error class for Google Drive API errors
 */
export class GDriveApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public operation?: string
  ) {
    super(message);
    this.name = 'GDriveApiError';
  }
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable (transient failures)
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof GDriveApiError) {
    // Retry on server errors (5xx) or rate limiting (429)
    return (
      error.statusCode !== undefined &&
      (error.statusCode >= 500 || error.statusCode === 429)
    );
  }
  // Retry on network errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnreset') ||
      message.includes('socket hang up')
    );
  }
  return false;
}

// ============================================================================
// Google Drive Client Implementation
// ============================================================================

/**
 * Google Drive API Client
 *
 * Provides methods for interacting with Google Drive through the
 * official googleapis SDK. Supports file operations, folder management,
 * and search with automatic retry logic for transient failures.
 */
export class GDriveClient {
  private config: Required<GDriveConfig>;
  private oauth2Client: OAuth2ClientType | null = null;
  private drive: drive_v3.Drive | null = null;
  private readonly RETRY_DELAY_MS = 1000;
  private readonly MAX_RETRIES = 3;

  constructor(config: GDriveConfig) {
    this.config = {
      credentialsPath: config.credentialsPath || path.join(process.cwd(), 'credentials.json'),
      tokenPath: config.tokenPath || path.join(process.cwd(), 'token.json'),
      scopes: config.scopes || DEFAULT_SCOPES,
    };
  }

  // ==========================================================================
  // Authentication Methods
  // ==========================================================================

  /**
   * Authorize the client with OAuth2
   * Will prompt for authorization if no valid token exists
   */
  async authorize(): Promise<boolean> {
    try {
      // Load client credentials
      if (!fs.existsSync(this.config.credentialsPath)) {
        console.error(`[GDrive Client] Credentials file not found: ${this.config.credentialsPath}`);
        return false;
      }

      const credentialsContent = fs.readFileSync(this.config.credentialsPath, 'utf-8');
      const credentials = JSON.parse(credentialsContent);

      const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

      this.oauth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris?.[0] || 'urn:ietf:wg:oauth:2.0:oob'
      );

      // Check for existing token
      if (fs.existsSync(this.config.tokenPath)) {
        const tokenContent = fs.readFileSync(this.config.tokenPath, 'utf-8');
        const token: Credentials = JSON.parse(tokenContent);
        this.oauth2Client.setCredentials(token);

        // Check if token needs refresh
        if (token.expiry_date && token.expiry_date < Date.now()) {
          console.error('[GDrive Client] Token expired, refreshing...');
          const { credentials: newCredentials } = await this.oauth2Client.refreshAccessToken();
          this.oauth2Client.setCredentials(newCredentials);
          this.saveToken(newCredentials);
        }
      } else {
        // No token, need to get authorization
        const authUrl = this.oauth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: this.config.scopes,
        });

        console.error('[GDrive Client] Authorize this app by visiting this url:', authUrl);

        // Interactive authorization
        const code = await this.promptForCode();
        const { tokens } = await this.oauth2Client.getToken(code);
        this.oauth2Client.setCredentials(tokens);
        this.saveToken(tokens);
        console.error('[GDrive Client] Token stored successfully');
      }

      // Initialize Drive API
      this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });

      return true;
    } catch (error) {
      console.error('[GDrive Client] Authorization failed:', error);
      return false;
    }
  }

  /**
   * Check if the client is authorized
   */
  async isAuthorized(): Promise<boolean> {
    if (!this.oauth2Client || !this.drive) {
      return false;
    }

    try {
      // Try a simple API call to verify credentials
      await this.drive.about.get({ fields: 'user' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Prompt user for authorization code
   */
  private promptForCode(): Promise<string> {
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        resolve(code);
      });
    });
  }

  /**
   * Save token to file
   */
  private saveToken(token: Credentials): void {
    fs.writeFileSync(this.config.tokenPath, JSON.stringify(token, null, 2));
    console.error(`[GDrive Client] Token saved to ${this.config.tokenPath}`);
  }

  /**
   * Ensure client is authorized before making API calls
   */
  private async ensureAuthorized(): Promise<void> {
    if (!this.drive) {
      const authorized = await this.authorize();
      if (!authorized) {
        throw new GDriveApiError('Not authorized. Call authorize() first.', 401);
      }
    }
  }

  // ==========================================================================
  // Core Request Method with Retry Logic
  // ==========================================================================

  /**
   * Execute a Drive API request with retry logic
   */
  private async executeWithRetry<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    await this.ensureAuthorized();

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Parse Google API error
        if ((error as any)?.code) {
          const statusCode = (error as any).code;
          lastError = new GDriveApiError(
            (error as any).message || 'Unknown error',
            statusCode,
            operation
          );
        }

        // Check if we should retry
        if (attempt < this.MAX_RETRIES && isRetryableError(error)) {
          const delay = this.RETRY_DELAY_MS * Math.pow(2, attempt); // Exponential backoff
          console.error(
            `[GDrive Client] ${operation} failed (attempt ${attempt + 1}/${this.MAX_RETRIES + 1}), retrying in ${delay}ms:`,
            lastError.message
          );
          await sleep(delay);
          continue;
        }

        break;
      }
    }

    throw lastError;
  }

  // ==========================================================================
  // File Operations
  // ==========================================================================

  /**
   * List files in Drive or a specific folder
   *
   * @param folderId - Optional folder ID to list (default: 'root')
   * @param pageSize - Number of files to return (default: 100)
   * @param pageToken - Token for pagination
   */
  async listFiles(
    folderId?: string,
    pageSize: number = 100,
    pageToken?: string
  ): Promise<GDriveSearchResult> {
    return this.executeWithRetry('listFiles', async () => {
      const query = folderId
        ? `'${folderId}' in parents and trashed = false`
        : 'trashed = false';

      const response = await this.drive!.files.list({
        q: query,
        pageSize,
        pageToken,
        fields: 'nextPageToken, files(id, name, mimeType, parents, createdTime, modifiedTime, size, webViewLink)',
        orderBy: 'modifiedTime desc',
      });

      const files: GDriveFile[] = (response.data.files || []).map((f) => ({
        id: f.id!,
        name: f.name!,
        mimeType: f.mimeType!,
        parents: f.parents || undefined,
        createdTime: f.createdTime || undefined,
        modifiedTime: f.modifiedTime || undefined,
        size: f.size || undefined,
        webViewLink: f.webViewLink || undefined,
      }));

      return {
        files,
        nextPageToken: response.data.nextPageToken || undefined,
      };
    });
  }

  /**
   * Search for files by query
   *
   * @param query - Search query (supports Drive query syntax)
   * @param pageSize - Number of results to return
   * @param pageToken - Token for pagination
   */
  async searchFiles(
    query: string,
    pageSize: number = 50,
    pageToken?: string
  ): Promise<GDriveSearchResult> {
    return this.executeWithRetry('searchFiles', async () => {
      // Build search query
      let driveQuery = `trashed = false`;

      // If query looks like a plain text search, add full-text search
      if (!query.includes(':') && !query.includes("'")) {
        driveQuery += ` and fullText contains '${query.replace(/'/g, "\\'")}'`;
      } else {
        // Assume it's already a valid Drive query
        driveQuery += ` and ${query}`;
      }

      const response = await this.drive!.files.list({
        q: driveQuery,
        pageSize,
        pageToken,
        fields: 'nextPageToken, files(id, name, mimeType, parents, createdTime, modifiedTime, size, webViewLink)',
        orderBy: 'modifiedTime desc',
      });

      const files: GDriveFile[] = (response.data.files || []).map((f) => ({
        id: f.id!,
        name: f.name!,
        mimeType: f.mimeType!,
        parents: f.parents || undefined,
        createdTime: f.createdTime || undefined,
        modifiedTime: f.modifiedTime || undefined,
        size: f.size || undefined,
        webViewLink: f.webViewLink || undefined,
      }));

      return {
        files,
        nextPageToken: response.data.nextPageToken || undefined,
      };
    });
  }

  /**
   * Get file metadata by ID
   *
   * @param fileId - The file ID
   */
  async getFile(fileId: string): Promise<GDriveFile> {
    return this.executeWithRetry('getFile', async () => {
      const response = await this.drive!.files.get({
        fileId,
        fields: 'id, name, mimeType, parents, createdTime, modifiedTime, size, webViewLink',
      });

      return {
        id: response.data.id!,
        name: response.data.name!,
        mimeType: response.data.mimeType!,
        parents: response.data.parents || undefined,
        createdTime: response.data.createdTime || undefined,
        modifiedTime: response.data.modifiedTime || undefined,
        size: response.data.size || undefined,
        webViewLink: response.data.webViewLink || undefined,
      };
    });
  }

  /**
   * Read file content
   * Note: For Google Docs, this exports as plain text
   *
   * @param fileId - The file ID
   */
  async readFileContent(fileId: string): Promise<string> {
    return this.executeWithRetry('readFileContent', async () => {
      // First get file metadata to determine type
      const file = await this.getFile(fileId);

      // Handle Google Docs/Sheets differently - export them
      if (file.mimeType === MIME_TYPES.DOCUMENT) {
        const response = await this.drive!.files.export({
          fileId,
          mimeType: 'text/plain',
        });
        return String(response.data);
      } else if (file.mimeType === MIME_TYPES.SPREADSHEET) {
        const response = await this.drive!.files.export({
          fileId,
          mimeType: 'text/csv',
        });
        return String(response.data);
      } else {
        // Regular file - download content
        const response = await this.drive!.files.get({
          fileId,
          alt: 'media',
        }, {
          responseType: 'text',
        });
        return String(response.data);
      }
    });
  }

  /**
   * Create a new file
   *
   * @param name - File name
   * @param content - File content
   * @param mimeType - MIME type (default: text/plain)
   * @param folderId - Parent folder ID (optional)
   */
  async createFile(
    name: string,
    content: string,
    mimeType: string = 'text/plain',
    folderId?: string
  ): Promise<GDriveFile> {
    return this.executeWithRetry('createFile', async () => {
      const fileMetadata: drive_v3.Schema$File = {
        name,
        mimeType,
      };

      if (folderId) {
        fileMetadata.parents = [folderId];
      }

      // Create media content
      const media = {
        mimeType,
        body: content,
      };

      const response = await this.drive!.files.create({
        requestBody: fileMetadata,
        media,
        fields: 'id, name, mimeType, parents, createdTime, modifiedTime, size, webViewLink',
      });

      return {
        id: response.data.id!,
        name: response.data.name!,
        mimeType: response.data.mimeType!,
        parents: response.data.parents || undefined,
        createdTime: response.data.createdTime || undefined,
        modifiedTime: response.data.modifiedTime || undefined,
        size: response.data.size || undefined,
        webViewLink: response.data.webViewLink || undefined,
      };
    });
  }

  /**
   * Update file content
   *
   * @param fileId - The file ID
   * @param content - New content
   */
  async updateFile(fileId: string, content: string): Promise<GDriveFile> {
    return this.executeWithRetry('updateFile', async () => {
      // Get current file to determine MIME type
      const existingFile = await this.getFile(fileId);

      const media = {
        mimeType: existingFile.mimeType,
        body: content,
      };

      const response = await this.drive!.files.update({
        fileId,
        media,
        fields: 'id, name, mimeType, parents, createdTime, modifiedTime, size, webViewLink',
      });

      return {
        id: response.data.id!,
        name: response.data.name!,
        mimeType: response.data.mimeType!,
        parents: response.data.parents || undefined,
        createdTime: response.data.createdTime || undefined,
        modifiedTime: response.data.modifiedTime || undefined,
        size: response.data.size || undefined,
        webViewLink: response.data.webViewLink || undefined,
      };
    });
  }

  /**
   * Delete a file (moves to trash)
   *
   * @param fileId - The file ID
   */
  async deleteFile(fileId: string): Promise<void> {
    return this.executeWithRetry('deleteFile', async () => {
      await this.drive!.files.delete({ fileId });
    });
  }

  // ==========================================================================
  // Folder Operations
  // ==========================================================================

  /**
   * Create a new folder
   *
   * @param name - Folder name
   * @param parentId - Parent folder ID (optional)
   */
  async createFolder(name: string, parentId?: string): Promise<GDriveFile> {
    return this.executeWithRetry('createFolder', async () => {
      const fileMetadata: drive_v3.Schema$File = {
        name,
        mimeType: MIME_TYPES.FOLDER,
      };

      if (parentId) {
        fileMetadata.parents = [parentId];
      }

      const response = await this.drive!.files.create({
        requestBody: fileMetadata,
        fields: 'id, name, mimeType, parents, createdTime, modifiedTime, webViewLink',
      });

      return {
        id: response.data.id!,
        name: response.data.name!,
        mimeType: response.data.mimeType!,
        parents: response.data.parents || undefined,
        createdTime: response.data.createdTime || undefined,
        modifiedTime: response.data.modifiedTime || undefined,
        webViewLink: response.data.webViewLink || undefined,
      };
    });
  }

  /**
   * Get or create a folder path
   * Creates intermediate folders as needed
   *
   * @param folderPath - Path like "Claude-Memories/episodic"
   */
  async getOrCreateFolder(folderPath: string): Promise<GDriveFile> {
    return this.executeWithRetry('getOrCreateFolder', async () => {
      const parts = folderPath.split('/').filter((p) => p.length > 0);
      let parentId: string | undefined;
      let currentFolder: GDriveFile | undefined;

      for (const part of parts) {
        // Search for existing folder
        const query = parentId
          ? `name = '${part}' and '${parentId}' in parents and mimeType = '${MIME_TYPES.FOLDER}' and trashed = false`
          : `name = '${part}' and 'root' in parents and mimeType = '${MIME_TYPES.FOLDER}' and trashed = false`;

        const response = await this.drive!.files.list({
          q: query,
          fields: 'files(id, name, mimeType, parents, createdTime, modifiedTime, webViewLink)',
          pageSize: 1,
        });

        if (response.data.files && response.data.files.length > 0) {
          const f = response.data.files[0];
          currentFolder = {
            id: f.id!,
            name: f.name!,
            mimeType: f.mimeType!,
            parents: f.parents || undefined,
            createdTime: f.createdTime || undefined,
            modifiedTime: f.modifiedTime || undefined,
            webViewLink: f.webViewLink || undefined,
          };
          parentId = currentFolder.id;
        } else {
          // Create folder
          currentFolder = await this.createFolder(part, parentId);
          parentId = currentFolder.id;
        }
      }

      if (!currentFolder) {
        throw new GDriveApiError('Failed to get or create folder', 500, 'getOrCreateFolder');
      }

      return currentFolder;
    });
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Test connection to Google Drive
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.ensureAuthorized();
      const response = await this.drive!.about.get({ fields: 'user' });
      console.error(`[GDrive Client] Connected as: ${response.data.user?.displayName}`);
      return true;
    } catch (error) {
      console.error('[GDrive Client] Connection test failed:', error);
      return false;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<GDriveConfig> {
    return { ...this.config };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Factory function to create a GDriveClient instance
 *
 * @param config - Configuration for the Google Drive client
 * @returns A new GDriveClient instance
 */
export function createGDriveClient(config: GDriveConfig): GDriveClient {
  return new GDriveClient(config);
}
