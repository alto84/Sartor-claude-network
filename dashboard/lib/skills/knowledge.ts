/**
 * Knowledge Skill - Obsidian Vault Integration
 *
 * Provides Claude with the ability to search and read notes
 * from the family's Obsidian vault via the Local REST API plugin.
 *
 * @module lib/skills/knowledge
 */

import {
  Skill,
  SkillExecutionResult,
  ClaudeToolDefinition,
  createSkill,
} from './index';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Obsidian REST API configuration
 */
const OBSIDIAN_CONFIG = {
  baseUrl: 'https://127.0.0.1:27124',
  apiKey: 'ff4bb67ad47c08b741581731d67f6df4f275eb756de2e777888b88ddb14ca29e',
  timeout: 10000,
};

/**
 * Headers for Obsidian API requests
 */
function getHeaders(): HeadersInit {
  return {
    'Authorization': `Bearer ${OBSIDIAN_CONFIG.apiKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Search notes in the Obsidian vault
 *
 * @param query - Search query string
 * @returns Array of matching notes with snippets
 */
export async function searchNotes(query: string): Promise<SkillExecutionResult<{
  results: Array<{
    path: string;
    filename: string;
    matches: string[];
    score: number;
  }>;
  total: number;
}>> {
  try {
    const response = await fetch(`${OBSIDIAN_CONFIG.baseUrl}/search/simple/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(OBSIDIAN_CONFIG.timeout),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Obsidian API error: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();

    // Transform the response to a consistent format
    const results = (data || []).map((item: {
      filename: string;
      matches?: Array<{ match: string }>;
      score?: number;
    }) => ({
      path: item.filename,
      filename: item.filename.split('/').pop() || item.filename,
      matches: (item.matches || []).map((m: { match: string }) => m.match).slice(0, 3),
      score: item.score || 0,
    }));

    return {
      success: true,
      data: {
        results,
        total: results.length,
      },
      metadata: {
        source: 'obsidian',
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to search notes: ${errorMessage}`,
    };
  }
}

/**
 * Read a note from the Obsidian vault
 *
 * @param path - Path to the note (relative to vault root)
 * @returns Note content and metadata
 */
export async function readNote(path: string): Promise<SkillExecutionResult<{
  path: string;
  content: string;
  frontmatter?: Record<string, unknown>;
}>> {
  try {
    // Normalize path - ensure it ends with .md if no extension
    const normalizedPath = path.endsWith('.md') ? path : `${path}.md`;

    const response = await fetch(
      `${OBSIDIAN_CONFIG.baseUrl}/vault/${encodeURIComponent(normalizedPath)}`,
      {
        method: 'GET',
        headers: getHeaders(),
        signal: AbortSignal.timeout(OBSIDIAN_CONFIG.timeout),
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          error: `Note not found: ${normalizedPath}`,
        };
      }
      const errorText = await response.text();
      return {
        success: false,
        error: `Obsidian API error: ${response.status} - ${errorText}`,
      };
    }

    const content = await response.text();

    // Parse frontmatter if present
    let frontmatter: Record<string, unknown> | undefined;
    let bodyContent = content;

    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (frontmatterMatch) {
      try {
        // Simple YAML-like parsing for frontmatter
        const frontmatterLines = frontmatterMatch[1].split('\n');
        frontmatter = {};
        for (const line of frontmatterLines) {
          const colonIndex = line.indexOf(':');
          if (colonIndex > 0) {
            const key = line.slice(0, colonIndex).trim();
            const value = line.slice(colonIndex + 1).trim();
            frontmatter[key] = value;
          }
        }
        bodyContent = frontmatterMatch[2];
      } catch {
        // If frontmatter parsing fails, just use the full content
      }
    }

    return {
      success: true,
      data: {
        path: normalizedPath,
        content: bodyContent,
        frontmatter,
      },
      metadata: {
        source: 'obsidian',
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to read note: ${errorMessage}`,
    };
  }
}

/**
 * List notes in a folder
 *
 * @param folder - Folder path (relative to vault root), empty string for root
 * @returns List of files and folders
 */
export async function listNotes(folder: string = ''): Promise<SkillExecutionResult<{
  path: string;
  files: Array<{
    name: string;
    path: string;
    type: 'file' | 'folder';
  }>;
}>> {
  try {
    const response = await fetch(
      `${OBSIDIAN_CONFIG.baseUrl}/vault/${encodeURIComponent(folder)}`,
      {
        method: 'GET',
        headers: {
          ...getHeaders(),
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(OBSIDIAN_CONFIG.timeout),
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          error: `Folder not found: ${folder || '/'}`,
        };
      }
      const errorText = await response.text();
      return {
        success: false,
        error: `Obsidian API error: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();

    // Transform to consistent format
    const files = (data.files || []).map((item: string | { path: string; name?: string }) => {
      const path = typeof item === 'string' ? item : item.path;
      const name = path.split('/').pop() || path;
      const isFolder = !path.includes('.') || path.endsWith('/');

      return {
        name,
        path,
        type: isFolder ? 'folder' : 'file',
      };
    });

    return {
      success: true,
      data: {
        path: folder || '/',
        files,
      },
      metadata: {
        source: 'obsidian',
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to list notes: ${errorMessage}`,
    };
  }
}

// ============================================================================
// SKILL DEFINITION
// ============================================================================

/**
 * Knowledge skill tool definition for Claude
 */
export const knowledgeToolDefinition: ClaudeToolDefinition = {
  name: 'knowledge',
  description: `Search and read notes from the family's Obsidian knowledge vault. Use this to find information about family projects, notes, reference materials, and any stored knowledge. Supports three operations:
- search: Find notes matching a query
- read: Get the full content of a specific note
- list: Browse folders in the vault`,
  input_schema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        description: 'The operation to perform: "search", "read", or "list"',
        enum: ['search', 'read', 'list'],
        required: true,
      },
      query: {
        type: 'string',
        description: 'Search query (required for "search" operation)',
        required: false,
      },
      path: {
        type: 'string',
        description: 'Note path for "read" operation, or folder path for "list" operation',
        required: false,
      },
    },
    required: ['operation'],
  },
};

/**
 * Execute the knowledge skill
 */
async function executeKnowledge(
  params: Record<string, unknown>
): Promise<SkillExecutionResult> {
  const operation = params.operation as string;

  switch (operation) {
    case 'search': {
      const query = params.query as string;
      if (!query) {
        return {
          success: false,
          error: 'Query is required for search operation',
        };
      }
      return searchNotes(query);
    }

    case 'read': {
      const path = params.path as string;
      if (!path) {
        return {
          success: false,
          error: 'Path is required for read operation',
        };
      }
      return readNote(path);
    }

    case 'list': {
      const folder = (params.path as string) || '';
      return listNotes(folder);
    }

    default:
      return {
        success: false,
        error: `Unknown operation: ${operation}. Use "search", "read", or "list"`,
      };
  }
}

/**
 * Knowledge skill for the Sartor Family Dashboard
 */
export const knowledgeSkill: Skill = {
  name: 'knowledge',
  description: "Search and read notes from the family's Obsidian knowledge vault",
  toolDefinition: knowledgeToolDefinition,
  execute: executeKnowledge,
};

// ============================================================================
// ALTERNATIVE: Using createSkill helper
// ============================================================================

/**
 * Alternative way to create the skill using the helper
 * (Kept as example, not exported as primary)
 */
export const knowledgeSkillAlt = createSkill({
  name: 'knowledge_alt',
  description: "Search and read notes from the family's Obsidian knowledge vault",
  parameters: {
    operation: {
      type: 'string',
      description: 'The operation to perform',
      enum: ['search', 'read', 'list'],
    },
    query: {
      type: 'string',
      description: 'Search query for search operation',
    },
    path: {
      type: 'string',
      description: 'Note or folder path',
    },
  },
  required: ['operation'],
  execute: executeKnowledge,
});
