/**
 * Knowledge Graph
 *
 * Graph-based memory organization:
 * - Entity relationship modeling
 * - Semantic linking between memories
 * - Graph traversal queries
 */

import * as crypto from 'crypto';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Entity types in the knowledge graph
 */
export enum EntityType {
  MEMORY = 'memory',
  CONCEPT = 'concept',
  PERSON = 'person',
  ORGANIZATION = 'organization',
  LOCATION = 'location',
  EVENT = 'event',
  PROJECT = 'project',
  TASK = 'task',
  SKILL = 'skill',
  DOCUMENT = 'document',
  CODE = 'code',
  CUSTOM = 'custom',
}

/**
 * Relationship types between entities
 */
export enum RelationType {
  // Hierarchical
  PARENT_OF = 'parent_of',
  CHILD_OF = 'child_of',
  CONTAINS = 'contains',
  PART_OF = 'part_of',

  // Associative
  RELATED_TO = 'related_to',
  SIMILAR_TO = 'similar_to',
  OPPOSITE_OF = 'opposite_of',
  DERIVED_FROM = 'derived_from',

  // Temporal
  PRECEDES = 'precedes',
  FOLLOWS = 'follows',
  CONCURRENT_WITH = 'concurrent_with',

  // Causal
  CAUSES = 'causes',
  CAUSED_BY = 'caused_by',
  ENABLES = 'enables',
  PREVENTS = 'prevents',

  // Ownership/Attribution
  CREATED_BY = 'created_by',
  OWNED_BY = 'owned_by',
  ASSIGNED_TO = 'assigned_to',

  // References
  REFERENCES = 'references',
  IMPLEMENTS = 'implements',
  EXTENDS = 'extends',
  DEPENDS_ON = 'depends_on',

  // Custom
  CUSTOM = 'custom',
}

/**
 * Entity in the knowledge graph
 */
export interface Entity {
  id: string;
  type: EntityType;
  name: string;
  description?: string;
  properties: Record<string, unknown>;
  observations: string[];
  createdAt: Date;
  updatedAt: Date;
  metadata: EntityMetadata;
}

/**
 * Entity metadata
 */
export interface EntityMetadata {
  source: string;
  confidence: number;
  importance: number;
  accessCount: number;
  lastAccessed?: Date;
  tags: string[];
  embeddings?: number[];
}

/**
 * Relationship between entities
 */
export interface Relationship {
  id: string;
  type: RelationType;
  customType?: string;
  sourceId: string;
  targetId: string;
  weight: number;
  properties: Record<string, unknown>;
  bidirectional: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Graph query result
 */
export interface QueryResult {
  entities: Entity[];
  relationships: Relationship[];
  paths: GraphPath[];
  metadata: {
    queryTime: number;
    totalNodes: number;
    totalEdges: number;
  };
}

/**
 * Path through the graph
 */
export interface GraphPath {
  nodes: Entity[];
  edges: Relationship[];
  totalWeight: number;
  length: number;
}

/**
 * Query options
 */
export interface QueryOptions {
  maxDepth?: number;
  maxResults?: number;
  relationTypes?: RelationType[];
  entityTypes?: EntityType[];
  minWeight?: number;
  includeMetadata?: boolean;
}

/**
 * Semantic link with similarity score
 */
export interface SemanticLink {
  sourceId: string;
  targetId: string;
  similarity: number;
  linkType: 'embedding' | 'keyword' | 'reference' | 'co-occurrence';
  confidence: number;
}

// ============================================================================
// KNOWLEDGE GRAPH IMPLEMENTATION
// ============================================================================

/**
 * In-memory Knowledge Graph implementation
 *
 * Provides graph-based memory organization with:
 * - Entity CRUD operations
 * - Relationship management
 * - Graph traversal algorithms
 * - Semantic linking
 */
export class KnowledgeGraph {
  private entities: Map<string, Entity> = new Map();
  private relationships: Map<string, Relationship> = new Map();
  private adjacencyList: Map<string, Set<string>> = new Map(); // entityId -> relationshipIds
  private reverseIndex: Map<string, Set<string>> = new Map(); // word -> entityIds

  constructor() {
    // Initialize
  }

  // ==========================================================================
  // ENTITY OPERATIONS
  // ==========================================================================

  /**
   * Create a new entity
   */
  createEntity(
    type: EntityType,
    name: string,
    options: {
      description?: string;
      properties?: Record<string, unknown>;
      observations?: string[];
      source?: string;
      importance?: number;
      tags?: string[];
    } = {}
  ): Entity {
    const id = crypto.randomUUID();
    const now = new Date();

    const entity: Entity = {
      id,
      type,
      name,
      description: options.description,
      properties: options.properties ?? {},
      observations: options.observations ?? [],
      createdAt: now,
      updatedAt: now,
      metadata: {
        source: options.source ?? 'unknown',
        confidence: 1.0,
        importance: options.importance ?? 0.5,
        accessCount: 0,
        tags: options.tags ?? [],
      },
    };

    this.entities.set(id, entity);
    this.adjacencyList.set(id, new Set());
    this.indexEntity(entity);

    return entity;
  }

  /**
   * Get entity by ID
   */
  getEntity(id: string): Entity | undefined {
    const entity = this.entities.get(id);
    if (entity) {
      entity.metadata.accessCount++;
      entity.metadata.lastAccessed = new Date();
    }
    return entity;
  }

  /**
   * Update an entity
   */
  updateEntity(
    id: string,
    updates: Partial<Omit<Entity, 'id' | 'createdAt'>>
  ): Entity | undefined {
    const entity = this.entities.get(id);
    if (!entity) return undefined;

    // Remove from index before update
    this.unindexEntity(entity);

    // Apply updates
    if (updates.name !== undefined) entity.name = updates.name;
    if (updates.description !== undefined) entity.description = updates.description;
    if (updates.type !== undefined) entity.type = updates.type;
    if (updates.properties !== undefined) {
      entity.properties = { ...entity.properties, ...updates.properties };
    }
    if (updates.observations !== undefined) {
      entity.observations = [...entity.observations, ...updates.observations];
    }
    if (updates.metadata !== undefined) {
      entity.metadata = { ...entity.metadata, ...updates.metadata };
    }
    entity.updatedAt = new Date();

    // Re-index
    this.indexEntity(entity);

    return entity;
  }

  /**
   * Delete an entity and its relationships
   */
  deleteEntity(id: string): boolean {
    const entity = this.entities.get(id);
    if (!entity) return false;

    // Remove from index
    this.unindexEntity(entity);

    // Remove all relationships
    const relationshipIds = this.adjacencyList.get(id);
    if (relationshipIds) {
      relationshipIds.forEach((relId) => {
        this.relationships.delete(relId);
      });
    }

    // Remove from other entities' adjacency lists
    this.adjacencyList.forEach((rels, entityId) => {
      if (entityId !== id) {
        rels.forEach((relId) => {
          const rel = this.relationships.get(relId);
          if (rel && (rel.sourceId === id || rel.targetId === id)) {
            rels.delete(relId);
            this.relationships.delete(relId);
          }
        });
      }
    });

    this.adjacencyList.delete(id);
    this.entities.delete(id);

    return true;
  }

  /**
   * Add observation to entity
   */
  addObservation(entityId: string, observation: string): boolean {
    const entity = this.entities.get(entityId);
    if (!entity) return false;

    entity.observations.push(observation);
    entity.updatedAt = new Date();
    this.indexText(observation, entityId);

    return true;
  }

  /**
   * Remove observation from entity
   */
  removeObservation(entityId: string, observation: string): boolean {
    const entity = this.entities.get(entityId);
    if (!entity) return false;

    const index = entity.observations.indexOf(observation);
    if (index === -1) return false;

    entity.observations.splice(index, 1);
    entity.updatedAt = new Date();

    return true;
  }

  // ==========================================================================
  // RELATIONSHIP OPERATIONS
  // ==========================================================================

  /**
   * Create a relationship between entities
   */
  createRelationship(
    sourceId: string,
    targetId: string,
    type: RelationType,
    options: {
      weight?: number;
      properties?: Record<string, unknown>;
      bidirectional?: boolean;
      customType?: string;
    } = {}
  ): Relationship | undefined {
    // Verify entities exist
    if (!this.entities.has(sourceId) || !this.entities.has(targetId)) {
      return undefined;
    }

    const id = crypto.randomUUID();
    const now = new Date();

    const relationship: Relationship = {
      id,
      type,
      customType: options.customType,
      sourceId,
      targetId,
      weight: options.weight ?? 1.0,
      properties: options.properties ?? {},
      bidirectional: options.bidirectional ?? false,
      createdAt: now,
      updatedAt: now,
    };

    this.relationships.set(id, relationship);

    // Update adjacency lists
    this.adjacencyList.get(sourceId)?.add(id);
    if (relationship.bidirectional) {
      this.adjacencyList.get(targetId)?.add(id);
    }

    return relationship;
  }

  /**
   * Get relationship by ID
   */
  getRelationship(id: string): Relationship | undefined {
    return this.relationships.get(id);
  }

  /**
   * Get relationships for an entity
   */
  getRelationshipsForEntity(
    entityId: string,
    direction: 'outgoing' | 'incoming' | 'both' = 'both'
  ): Relationship[] {
    const result: Relationship[] = [];

    this.relationships.forEach((rel) => {
      if (direction === 'outgoing' || direction === 'both') {
        if (rel.sourceId === entityId) {
          result.push(rel);
        }
      }
      if (direction === 'incoming' || direction === 'both') {
        if (rel.targetId === entityId) {
          result.push(rel);
        }
        if (rel.bidirectional && rel.sourceId === entityId) {
          result.push(rel);
        }
      }
    });

    return result;
  }

  /**
   * Update a relationship
   */
  updateRelationship(
    id: string,
    updates: Partial<Omit<Relationship, 'id' | 'sourceId' | 'targetId' | 'createdAt'>>
  ): Relationship | undefined {
    const relationship = this.relationships.get(id);
    if (!relationship) return undefined;

    if (updates.type !== undefined) relationship.type = updates.type;
    if (updates.weight !== undefined) relationship.weight = updates.weight;
    if (updates.properties !== undefined) {
      relationship.properties = { ...relationship.properties, ...updates.properties };
    }
    if (updates.bidirectional !== undefined) relationship.bidirectional = updates.bidirectional;
    relationship.updatedAt = new Date();

    return relationship;
  }

  /**
   * Delete a relationship
   */
  deleteRelationship(id: string): boolean {
    const relationship = this.relationships.get(id);
    if (!relationship) return false;

    // Remove from adjacency lists
    this.adjacencyList.get(relationship.sourceId)?.delete(id);
    this.adjacencyList.get(relationship.targetId)?.delete(id);

    this.relationships.delete(id);
    return true;
  }

  // ==========================================================================
  // GRAPH QUERIES
  // ==========================================================================

  /**
   * Search entities by text
   */
  searchEntities(
    query: string,
    options: {
      types?: EntityType[];
      limit?: number;
      minRelevance?: number;
    } = {}
  ): Array<{ entity: Entity; relevance: number }> {
    const words = this.tokenize(query.toLowerCase());
    const scores: Map<string, number> = new Map();

    // Score entities by word matches
    for (const word of words) {
      const matchingIds = this.reverseIndex.get(word);
      if (matchingIds) {
        matchingIds.forEach((entityId) => {
          const current = scores.get(entityId) || 0;
          scores.set(entityId, current + 1);
        });
      }
    }

    // Convert to results
    const results: Array<{ entity: Entity; relevance: number }> = [];
    scores.forEach((score, entityId) => {
      const entity = this.entities.get(entityId);
      if (!entity) return;

      // Filter by type
      if (options.types && !options.types.includes(entity.type)) return;

      const relevance = score / words.length;

      // Filter by min relevance
      if (options.minRelevance && relevance < options.minRelevance) return;

      results.push({ entity, relevance });
    });

    // Sort by relevance and limit
    results.sort((a, b) => b.relevance - a.relevance);
    if (options.limit) {
      return results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Get neighbors of an entity
   */
  getNeighbors(
    entityId: string,
    options: QueryOptions = {}
  ): Entity[] {
    const relationships = this.getRelationshipsForEntity(entityId, 'both');
    const neighborIds = new Set<string>();

    for (const rel of relationships) {
      // Filter by relation type
      if (options.relationTypes && !options.relationTypes.includes(rel.type)) {
        continue;
      }

      // Filter by weight
      if (options.minWeight && rel.weight < options.minWeight) {
        continue;
      }

      const neighborId = rel.sourceId === entityId ? rel.targetId : rel.sourceId;
      const neighbor = this.entities.get(neighborId);

      if (neighbor) {
        // Filter by entity type
        if (options.entityTypes && !options.entityTypes.includes(neighbor.type)) {
          continue;
        }
        neighborIds.add(neighborId);
      }
    }

    const neighbors: Entity[] = [];
    neighborIds.forEach((id) => {
      const entity = this.entities.get(id);
      if (entity) neighbors.push(entity);
    });

    // Apply limit
    if (options.maxResults) {
      return neighbors.slice(0, options.maxResults);
    }

    return neighbors;
  }

  /**
   * Find shortest path between two entities
   */
  findShortestPath(
    startId: string,
    endId: string,
    options: QueryOptions = {}
  ): GraphPath | undefined {
    if (!this.entities.has(startId) || !this.entities.has(endId)) {
      return undefined;
    }

    // BFS for shortest path
    const maxDepth = options.maxDepth ?? 10;
    const visited = new Set<string>();
    const queue: Array<{ entityId: string; path: GraphPath }> = [];

    const startEntity = this.entities.get(startId)!;
    queue.push({
      entityId: startId,
      path: { nodes: [startEntity], edges: [], totalWeight: 0, length: 0 },
    });
    visited.add(startId);

    while (queue.length > 0) {
      const { entityId, path } = queue.shift()!;

      if (path.length >= maxDepth) continue;

      const relationships = this.getRelationshipsForEntity(entityId, 'both');

      for (const rel of relationships) {
        // Filter by relation type
        if (options.relationTypes && !options.relationTypes.includes(rel.type)) {
          continue;
        }

        const neighborId = rel.sourceId === entityId ? rel.targetId : rel.sourceId;

        if (visited.has(neighborId)) continue;
        visited.add(neighborId);

        const neighbor = this.entities.get(neighborId);
        if (!neighbor) continue;

        // Filter by entity type
        if (options.entityTypes && !options.entityTypes.includes(neighbor.type)) {
          continue;
        }

        const newPath: GraphPath = {
          nodes: [...path.nodes, neighbor],
          edges: [...path.edges, rel],
          totalWeight: path.totalWeight + rel.weight,
          length: path.length + 1,
        };

        if (neighborId === endId) {
          return newPath;
        }

        queue.push({ entityId: neighborId, path: newPath });
      }
    }

    return undefined;
  }

  /**
   * Find all paths between two entities
   */
  findAllPaths(
    startId: string,
    endId: string,
    options: QueryOptions = {}
  ): GraphPath[] {
    if (!this.entities.has(startId) || !this.entities.has(endId)) {
      return [];
    }

    const paths: GraphPath[] = [];
    const maxDepth = options.maxDepth ?? 5;
    const maxResults = options.maxResults ?? 100;

    const dfs = (
      currentId: string,
      path: GraphPath,
      visited: Set<string>
    ): void => {
      if (paths.length >= maxResults) return;
      if (path.length >= maxDepth) return;

      const relationships = this.getRelationshipsForEntity(currentId, 'both');

      for (const rel of relationships) {
        // Filter by relation type
        if (options.relationTypes && !options.relationTypes.includes(rel.type)) {
          continue;
        }

        const neighborId = rel.sourceId === currentId ? rel.targetId : rel.sourceId;

        if (visited.has(neighborId)) continue;

        const neighbor = this.entities.get(neighborId);
        if (!neighbor) continue;

        // Filter by entity type
        if (options.entityTypes && !options.entityTypes.includes(neighbor.type)) {
          continue;
        }

        const newPath: GraphPath = {
          nodes: [...path.nodes, neighbor],
          edges: [...path.edges, rel],
          totalWeight: path.totalWeight + rel.weight,
          length: path.length + 1,
        };

        if (neighborId === endId) {
          paths.push(newPath);
          continue;
        }

        const newVisited = new Set(visited);
        newVisited.add(neighborId);
        dfs(neighborId, newPath, newVisited);
      }
    };

    const startEntity = this.entities.get(startId)!;
    const initialPath: GraphPath = {
      nodes: [startEntity],
      edges: [],
      totalWeight: 0,
      length: 0,
    };
    const visited = new Set<string>([startId]);

    dfs(startId, initialPath, visited);

    return paths;
  }

  /**
   * Execute a graph traversal query
   */
  traverse(
    startId: string,
    options: QueryOptions = {}
  ): QueryResult {
    const startTime = Date.now();
    const maxDepth = options.maxDepth ?? 3;
    const entities: Entity[] = [];
    const relationships: Relationship[] = [];
    const visitedEntities = new Set<string>();
    const visitedRelationships = new Set<string>();

    const bfs = (entityId: string, depth: number): void => {
      if (depth > maxDepth) return;
      if (visitedEntities.has(entityId)) return;

      const entity = this.entities.get(entityId);
      if (!entity) return;

      // Filter by entity type
      if (options.entityTypes && !options.entityTypes.includes(entity.type)) {
        return;
      }

      visitedEntities.add(entityId);
      entities.push(entity);

      const rels = this.getRelationshipsForEntity(entityId, 'both');

      for (const rel of rels) {
        if (visitedRelationships.has(rel.id)) continue;

        // Filter by relation type
        if (options.relationTypes && !options.relationTypes.includes(rel.type)) {
          continue;
        }

        // Filter by weight
        if (options.minWeight && rel.weight < options.minWeight) {
          continue;
        }

        visitedRelationships.add(rel.id);
        relationships.push(rel);

        const neighborId = rel.sourceId === entityId ? rel.targetId : rel.sourceId;
        bfs(neighborId, depth + 1);
      }
    };

    bfs(startId, 0);

    return {
      entities,
      relationships,
      paths: [],
      metadata: {
        queryTime: Date.now() - startTime,
        totalNodes: entities.length,
        totalEdges: relationships.length,
      },
    };
  }

  // ==========================================================================
  // SEMANTIC LINKING
  // ==========================================================================

  /**
   * Find semantically similar entities
   */
  findSimilar(
    entityId: string,
    options: {
      limit?: number;
      minSimilarity?: number;
      types?: EntityType[];
    } = {}
  ): SemanticLink[] {
    const entity = this.entities.get(entityId);
    if (!entity) return [];

    const links: SemanticLink[] = [];
    const entityWords = new Set(this.tokenize(this.getEntityText(entity).toLowerCase()));

    this.entities.forEach((other, otherId) => {
      if (otherId === entityId) return;

      // Filter by type
      if (options.types && !options.types.includes(other.type)) return;

      // Calculate word overlap similarity
      const otherWords = new Set(this.tokenize(this.getEntityText(other).toLowerCase()));
      const intersection = new Set<string>();
      entityWords.forEach((word) => {
        if (otherWords.has(word)) {
          intersection.add(word);
        }
      });
      const union = new Set<string>();
      entityWords.forEach((word) => union.add(word));
      otherWords.forEach((word) => union.add(word));

      const similarity = union.size > 0 ? intersection.size / union.size : 0;

      // Filter by min similarity
      if (options.minSimilarity && similarity < options.minSimilarity) return;

      if (similarity > 0) {
        links.push({
          sourceId: entityId,
          targetId: otherId,
          similarity,
          linkType: 'keyword',
          confidence: Math.min(1, similarity * 1.5),
        });
      }
    });

    // Sort by similarity
    links.sort((a, b) => b.similarity - a.similarity);

    // Apply limit
    if (options.limit) {
      return links.slice(0, options.limit);
    }

    return links;
  }

  /**
   * Create semantic links based on similarity
   */
  createSemanticLinks(
    minSimilarity: number = 0.3,
    relationWeight: number = 0.5
  ): number {
    let linksCreated = 0;

    const entityIds: string[] = [];
    this.entities.forEach((_, id) => entityIds.push(id));

    for (let i = 0; i < entityIds.length; i++) {
      const links = this.findSimilar(entityIds[i], {
        minSimilarity,
        limit: 5,
      });

      for (const link of links) {
        // Check if relationship already exists
        const existingRels = this.getRelationshipsForEntity(link.sourceId, 'outgoing');
        const exists = existingRels.some(
          (rel) =>
            rel.targetId === link.targetId &&
            rel.type === RelationType.SIMILAR_TO
        );

        if (!exists) {
          this.createRelationship(link.sourceId, link.targetId, RelationType.SIMILAR_TO, {
            weight: link.similarity * relationWeight,
            bidirectional: true,
            properties: {
              linkType: link.linkType,
              confidence: link.confidence,
            },
          });
          linksCreated++;
        }
      }
    }

    return linksCreated;
  }

  // ==========================================================================
  // INDEXING
  // ==========================================================================

  /**
   * Index an entity for search
   */
  private indexEntity(entity: Entity): void {
    const text = this.getEntityText(entity);
    this.indexText(text, entity.id);
  }

  /**
   * Remove entity from index
   */
  private unindexEntity(entity: Entity): void {
    const text = this.getEntityText(entity);
    const words = this.tokenize(text.toLowerCase());

    for (const word of words) {
      const entityIds = this.reverseIndex.get(word);
      if (entityIds) {
        entityIds.delete(entity.id);
        if (entityIds.size === 0) {
          this.reverseIndex.delete(word);
        }
      }
    }
  }

  /**
   * Index text for an entity
   */
  private indexText(text: string, entityId: string): void {
    const words = this.tokenize(text.toLowerCase());

    for (const word of words) {
      if (!this.reverseIndex.has(word)) {
        this.reverseIndex.set(word, new Set());
      }
      this.reverseIndex.get(word)!.add(entityId);
    }
  }

  /**
   * Get searchable text from entity
   */
  private getEntityText(entity: Entity): string {
    const parts = [
      entity.name,
      entity.description || '',
      ...entity.observations,
      ...entity.metadata.tags,
    ];
    return parts.join(' ');
  }

  /**
   * Tokenize text into words
   */
  private tokenize(text: string): string[] {
    return text
      .split(/\W+/)
      .filter((word) => word.length > 2)
      .filter((word) => !this.isStopWord(word));
  }

  /**
   * Check if word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'must', 'this', 'that', 'these',
      'those', 'it', 'its', 'they', 'them', 'their', 'we', 'us', 'our',
      'you', 'your', 'he', 'him', 'his', 'she', 'her', 'not', 'all', 'any',
    ]);
    return stopWords.has(word);
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  /**
   * Get all entities
   */
  getAllEntities(): Entity[] {
    const entities: Entity[] = [];
    this.entities.forEach((entity) => entities.push(entity));
    return entities;
  }

  /**
   * Get all relationships
   */
  getAllRelationships(): Relationship[] {
    const relationships: Relationship[] = [];
    this.relationships.forEach((rel) => relationships.push(rel));
    return relationships;
  }

  /**
   * Get entities by type
   */
  getEntitiesByType(type: EntityType): Entity[] {
    const entities: Entity[] = [];
    this.entities.forEach((entity) => {
      if (entity.type === type) {
        entities.push(entity);
      }
    });
    return entities;
  }

  /**
   * Get relationships by type
   */
  getRelationshipsByType(type: RelationType): Relationship[] {
    const relationships: Relationship[] = [];
    this.relationships.forEach((rel) => {
      if (rel.type === type) {
        relationships.push(rel);
      }
    });
    return relationships;
  }

  /**
   * Get graph statistics
   */
  getStats(): {
    entityCount: number;
    relationshipCount: number;
    entityTypes: Record<string, number>;
    relationTypes: Record<string, number>;
    avgRelationshipsPerEntity: number;
    indexedWords: number;
  } {
    const entityTypes: Record<string, number> = {};
    const relationTypes: Record<string, number> = {};

    this.entities.forEach((entity) => {
      entityTypes[entity.type] = (entityTypes[entity.type] || 0) + 1;
    });

    this.relationships.forEach((rel) => {
      relationTypes[rel.type] = (relationTypes[rel.type] || 0) + 1;
    });

    const entityCount = this.entities.size;
    const relationshipCount = this.relationships.size;

    return {
      entityCount,
      relationshipCount,
      entityTypes,
      relationTypes,
      avgRelationshipsPerEntity: entityCount > 0 ? relationshipCount / entityCount : 0,
      indexedWords: this.reverseIndex.size,
    };
  }

  /**
   * Clear the graph
   */
  clear(): void {
    this.entities.clear();
    this.relationships.clear();
    this.adjacencyList.clear();
    this.reverseIndex.clear();
  }

  /**
   * Export graph to JSON
   */
  toJSON(): {
    entities: Entity[];
    relationships: Relationship[];
  } {
    return {
      entities: this.getAllEntities(),
      relationships: this.getAllRelationships(),
    };
  }

  /**
   * Import graph from JSON
   */
  fromJSON(data: { entities: Entity[]; relationships: Relationship[] }): void {
    this.clear();

    // Import entities
    for (const entity of data.entities) {
      this.entities.set(entity.id, {
        ...entity,
        createdAt: new Date(entity.createdAt),
        updatedAt: new Date(entity.updatedAt),
      });
      this.adjacencyList.set(entity.id, new Set());
      this.indexEntity(entity);
    }

    // Import relationships
    for (const rel of data.relationships) {
      this.relationships.set(rel.id, {
        ...rel,
        createdAt: new Date(rel.createdAt),
        updatedAt: new Date(rel.updatedAt),
      });
      this.adjacencyList.get(rel.sourceId)?.add(rel.id);
      if (rel.bidirectional) {
        this.adjacencyList.get(rel.targetId)?.add(rel.id);
      }
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default KnowledgeGraph;
