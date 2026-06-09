/**
 * Cold Memory Tier - GitHub-based Persistent Storage
 * Uses GitHub for long-term pattern retention (1-5s latency)
 */

import { Octokit } from '@octokit/rest';
import { Buffer } from 'buffer';

export interface ColdTier {
  get(path: string): Promise<any>;
  set(path: string, content: any, message: string): Promise<void>;
  delete(path: string, message: string): Promise<void>;
  list(directory: string): Promise<string[]>;
}

export class GitHubColdTier implements ColdTier {
  private client: Octokit;
  private owner: string;
  private repo: string;
  private basePath: string;

  constructor(token: string, owner: string, repo: string, basePath = 'patterns') {
    this.client = new Octokit({ auth: token });
    this.owner = owner;
    this.repo = repo;
    this.basePath = basePath;
  }

  async get(path: string): Promise<any> {
    try {
      const fullPath = this.joinPath(this.basePath, path);
      const response = await this.client.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: fullPath,
      });

      if (Array.isArray(response.data)) throw new Error(`Directory: ${path}`);
      if (!('content' in response.data) || !response.data.content)
        throw new Error(`No content: ${path}`);
      const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
      return JSON.parse(content);
    } catch (error: any) {
      if (error.status === 404) return null;
      throw new Error(`Get failed: ${error.message}`);
    }
  }

  async set(path: string, content: any, message: string): Promise<void> {
    try {
      const fullPath = this.joinPath(this.basePath, path);
      const jsonContent = JSON.stringify(content, null, 2);
      const base64Content = Buffer.from(jsonContent).toString('base64');

      let sha: string | undefined;
      try {
        const existing = await this.client.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path: fullPath,
        });
        if (!Array.isArray(existing.data)) sha = existing.data.sha;
      } catch {
        // File doesn't exist
      }

      await this.client.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: fullPath,
        message,
        content: base64Content,
        ...(sha && { sha }),
      });
    } catch (error: any) {
      throw new Error(`Set failed: ${error.message}`);
    }
  }

  async delete(path: string, message: string): Promise<void> {
    try {
      const fullPath = this.joinPath(this.basePath, path);
      const response = await this.client.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: fullPath,
      });

      if (Array.isArray(response.data)) throw new Error(`Directory: ${path}`);
      await this.client.repos.deleteFile({
        owner: this.owner,
        repo: this.repo,
        path: fullPath,
        message,
        sha: response.data.sha,
      });
    } catch (error: any) {
      if (error.status === 404) return;
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  async list(directory: string): Promise<string[]> {
    try {
      const fullPath = this.joinPath(this.basePath, directory);
      const response = await this.client.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: fullPath,
      });

      if (!Array.isArray(response.data)) throw new Error(`Not a directory: ${directory}`);
      return response.data
        .filter((item) => item.type === 'file' && item.name.endsWith('.json'))
        .map((item) => item.name);
    } catch (error: any) {
      if (error.status === 404) return [];
      throw new Error(`List failed: ${error.message}`);
    }
  }

  private joinPath(...parts: string[]): string {
    return parts
      .filter((p) => p)
      .join('/')
      .replace(/\/+/g, '/');
  }

  async ensureBaseDirectory(): Promise<void> {
    try {
      const keepPath = this.joinPath(this.basePath, '.gitkeep');
      const existing = await this.client.repos
        .getContent({
          owner: this.owner,
          repo: this.repo,
          path: keepPath,
        })
        .catch(() => null);

      if (!existing) {
        await this.client.repos.createOrUpdateFileContents({
          owner: this.owner,
          repo: this.repo,
          path: keepPath,
          message: 'Initialize cold tier base directory',
          content: Buffer.from('').toString('base64'),
        });
      }
    } catch (error: any) {
      console.warn(`Base directory setup failed: ${error.message}`);
    }
  }
}

export function createGitHubColdTier(
  token: string,
  owner: string,
  repo: string,
  basePath?: string
): ColdTier {
  return new GitHubColdTier(token, owner, repo, basePath);
}
