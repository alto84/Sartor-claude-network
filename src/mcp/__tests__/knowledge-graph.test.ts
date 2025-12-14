/**
 * Knowledge Graph Tests
 */

import { KnowledgeGraph, EntityType, RelationType } from '../knowledge-graph';

describe('KnowledgeGraph', () => {
  let graph: KnowledgeGraph;

  beforeEach(() => {
    graph = new KnowledgeGraph();
  });

  describe('Entity Operations', () => {
    describe('createEntity', () => {
      it('should create an entity with required fields', () => {
        const entity = graph.createEntity(EntityType.CONCEPT, 'TypeScript');

        expect(entity.id).toBeDefined();
        expect(entity.type).toBe(EntityType.CONCEPT);
        expect(entity.name).toBe('TypeScript');
        expect(entity.createdAt).toBeDefined();
      });

      it('should create an entity with optional fields', () => {
        const entity = graph.createEntity(EntityType.PERSON, 'Alice', {
          description: 'A developer',
          properties: { role: 'engineer' },
          observations: ['Works at Acme Corp'],
          tags: ['developer', 'senior'],
          importance: 0.8,
        });

        expect(entity.description).toBe('A developer');
        expect(entity.properties.role).toBe('engineer');
        expect(entity.observations).toContain('Works at Acme Corp');
        expect(entity.metadata.tags).toContain('developer');
        expect(entity.metadata.importance).toBe(0.8);
      });
    });

    describe('getEntity', () => {
      it('should retrieve an existing entity', () => {
        const created = graph.createEntity(EntityType.CONCEPT, 'Testing');
        const retrieved = graph.getEntity(created.id);

        expect(retrieved).toBeDefined();
        expect(retrieved?.name).toBe('Testing');
      });

      it('should return undefined for non-existent entity', () => {
        const retrieved = graph.getEntity('non-existent-id');
        expect(retrieved).toBeUndefined();
      });

      it('should increment access count on retrieval', () => {
        const entity = graph.createEntity(EntityType.CONCEPT, 'Popular');

        graph.getEntity(entity.id);
        graph.getEntity(entity.id);
        graph.getEntity(entity.id);

        const retrieved = graph.getEntity(entity.id);
        expect(retrieved?.metadata.accessCount).toBe(4);
      });
    });

    describe('updateEntity', () => {
      it('should update entity fields', () => {
        const entity = graph.createEntity(EntityType.CONCEPT, 'Original');
        const updated = graph.updateEntity(entity.id, {
          name: 'Updated',
          description: 'New description',
        });

        expect(updated?.name).toBe('Updated');
        expect(updated?.description).toBe('New description');
      });

      it('should merge properties', () => {
        const entity = graph.createEntity(EntityType.CONCEPT, 'Test', {
          properties: { a: 1 },
        });

        graph.updateEntity(entity.id, {
          properties: { b: 2 },
        });

        const retrieved = graph.getEntity(entity.id);
        expect(retrieved?.properties.a).toBe(1);
        expect(retrieved?.properties.b).toBe(2);
      });
    });

    describe('deleteEntity', () => {
      it('should remove entity', () => {
        const entity = graph.createEntity(EntityType.CONCEPT, 'ToDelete');
        const deleted = graph.deleteEntity(entity.id);

        expect(deleted).toBe(true);
        expect(graph.getEntity(entity.id)).toBeUndefined();
      });

      it('should return false for non-existent entity', () => {
        const deleted = graph.deleteEntity('non-existent');
        expect(deleted).toBe(false);
      });
    });

    describe('addObservation', () => {
      it('should add observation to entity', () => {
        const entity = graph.createEntity(EntityType.PERSON, 'Bob');
        graph.addObservation(entity.id, 'Likes coffee');

        const retrieved = graph.getEntity(entity.id);
        expect(retrieved?.observations).toContain('Likes coffee');
      });
    });
  });

  describe('Relationship Operations', () => {
    let alice: ReturnType<typeof graph.createEntity>;
    let bob: ReturnType<typeof graph.createEntity>;

    beforeEach(() => {
      alice = graph.createEntity(EntityType.PERSON, 'Alice');
      bob = graph.createEntity(EntityType.PERSON, 'Bob');
    });

    describe('createRelationship', () => {
      it('should create a relationship between entities', () => {
        const rel = graph.createRelationship(alice.id, bob.id, RelationType.RELATED_TO);

        expect(rel).toBeDefined();
        expect(rel?.sourceId).toBe(alice.id);
        expect(rel?.targetId).toBe(bob.id);
        expect(rel?.type).toBe(RelationType.RELATED_TO);
      });

      it('should fail for non-existent entities', () => {
        const rel = graph.createRelationship('fake-id', bob.id, RelationType.RELATED_TO);

        expect(rel).toBeUndefined();
      });

      it('should support bidirectional relationships', () => {
        const rel = graph.createRelationship(alice.id, bob.id, RelationType.SIMILAR_TO, {
          bidirectional: true,
        });

        expect(rel?.bidirectional).toBe(true);
      });

      it('should support custom weights', () => {
        const rel = graph.createRelationship(alice.id, bob.id, RelationType.RELATED_TO, {
          weight: 0.9,
        });

        expect(rel?.weight).toBe(0.9);
      });
    });

    describe('getRelationshipsForEntity', () => {
      it('should get all relationships for an entity', () => {
        const charlie = graph.createEntity(EntityType.PERSON, 'Charlie');

        graph.createRelationship(alice.id, bob.id, RelationType.RELATED_TO);
        graph.createRelationship(alice.id, charlie.id, RelationType.RELATED_TO);

        const rels = graph.getRelationshipsForEntity(alice.id);
        expect(rels.length).toBe(2);
      });

      it('should filter by direction', () => {
        graph.createRelationship(alice.id, bob.id, RelationType.PARENT_OF);
        graph.createRelationship(bob.id, alice.id, RelationType.CHILD_OF);

        const outgoing = graph.getRelationshipsForEntity(alice.id, 'outgoing');
        expect(outgoing.length).toBe(1);
        expect(outgoing[0].type).toBe(RelationType.PARENT_OF);
      });
    });

    describe('deleteRelationship', () => {
      it('should remove relationship', () => {
        const rel = graph.createRelationship(alice.id, bob.id, RelationType.RELATED_TO);

        const deleted = graph.deleteRelationship(rel!.id);
        expect(deleted).toBe(true);

        const rels = graph.getRelationshipsForEntity(alice.id);
        expect(rels.length).toBe(0);
      });
    });
  });

  describe('Graph Queries', () => {
    beforeEach(() => {
      // Create a small graph
      const ts = graph.createEntity(EntityType.CONCEPT, 'TypeScript', {
        description: 'A typed programming language',
        tags: ['programming', 'javascript'],
      });
      const js = graph.createEntity(EntityType.CONCEPT, 'JavaScript', {
        description: 'A dynamic programming language',
        tags: ['programming', 'web'],
      });
      const node = graph.createEntity(EntityType.CONCEPT, 'Node.js', {
        description: 'JavaScript runtime',
        tags: ['runtime', 'server'],
      });

      graph.createRelationship(ts.id, js.id, RelationType.DERIVED_FROM);
      graph.createRelationship(node.id, js.id, RelationType.DEPENDS_ON);
    });

    describe('searchEntities', () => {
      it('should find entities by text search', () => {
        const results = graph.searchEntities('programming');

        expect(results.length).toBe(2);
        expect(results[0].entity.name).toBeDefined();
      });

      it('should limit results', () => {
        const results = graph.searchEntities('programming', { limit: 1 });
        expect(results.length).toBe(1);
      });

      it('should filter by type', () => {
        const person = graph.createEntity(EntityType.PERSON, 'Programming Expert');
        const results = graph.searchEntities('programming', {
          types: [EntityType.PERSON],
        });

        expect(results.length).toBe(1);
        expect(results[0].entity.type).toBe(EntityType.PERSON);
      });
    });

    describe('getNeighbors', () => {
      it('should get neighboring entities', () => {
        // TypeScript has 1 neighbor (JavaScript via DERIVED_FROM)
        const ts = graph.searchEntities('TypeScript')[0].entity;
        const neighbors = graph.getNeighbors(ts.id);

        expect(neighbors.length).toBeGreaterThanOrEqual(1);
      });

      it('should filter by relation type', () => {
        const ts = graph.searchEntities('TypeScript')[0].entity;
        const neighbors = graph.getNeighbors(ts.id, {
          relationTypes: [RelationType.DERIVED_FROM],
        });

        expect(neighbors.length).toBe(1);
        expect(neighbors[0].name).toBe('JavaScript');
      });
    });

    describe('findShortestPath', () => {
      it('should find path between connected entities', () => {
        // Create fresh connected entities for this test
        const a = graph.createEntity(EntityType.CONCEPT, 'NodeA');
        const b = graph.createEntity(EntityType.CONCEPT, 'NodeB');
        graph.createRelationship(a.id, b.id, RelationType.RELATED_TO);

        const path = graph.findShortestPath(a.id, b.id);

        expect(path).toBeDefined();
        expect(path?.length).toBeGreaterThanOrEqual(1);
        expect(path?.nodes.length).toBeGreaterThanOrEqual(2);
      });

      it('should return undefined for unconnected entities', () => {
        const isolated = graph.createEntity(EntityType.CONCEPT, 'Isolated');
        const other = graph.createEntity(EntityType.CONCEPT, 'Other');

        const path = graph.findShortestPath(isolated.id, other.id);
        expect(path).toBeUndefined();
      });
    });

    describe('traverse', () => {
      it('should traverse graph from starting point', () => {
        const ts = graph.searchEntities('TypeScript')[0].entity;
        const result = graph.traverse(ts.id, { maxDepth: 2 });

        expect(result.entities.length).toBeGreaterThan(0);
        expect(result.metadata.queryTime).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Semantic Linking', () => {
    beforeEach(() => {
      graph.createEntity(EntityType.CONCEPT, 'Machine Learning', {
        description: 'AI technique for pattern recognition',
        tags: ['ai', 'data'],
      });
      graph.createEntity(EntityType.CONCEPT, 'Deep Learning', {
        description: 'AI technique using neural networks',
        tags: ['ai', 'neural'],
      });
      graph.createEntity(EntityType.CONCEPT, 'Cooking', {
        description: 'Food preparation technique',
        tags: ['food', 'culinary'],
      });
    });

    describe('findSimilar', () => {
      it('should find semantically similar entities', () => {
        const ml = graph.searchEntities('Machine Learning')[0].entity;
        const similar = graph.findSimilar(ml.id, { minSimilarity: 0.1 });

        expect(similar.length).toBeGreaterThan(0);
        // Deep Learning should be more similar than Cooking
        const dlLink = similar.find((s) => {
          const target = graph.getEntity(s.targetId);
          return target?.name === 'Deep Learning';
        });
        expect(dlLink).toBeDefined();
      });
    });

    describe('createSemanticLinks', () => {
      it('should create semantic relationships', () => {
        const created = graph.createSemanticLinks(0.1, 0.5);

        expect(created).toBeGreaterThan(0);

        const ml = graph.searchEntities('Machine Learning')[0].entity;
        const rels = graph.getRelationshipsForEntity(ml.id);
        const similarRels = rels.filter((r) => r.type === RelationType.SIMILAR_TO);

        expect(similarRels.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Utilities', () => {
    describe('getStats', () => {
      it('should return accurate statistics', () => {
        // Clear first to ensure clean state
        graph.clear();

        const a = graph.createEntity(EntityType.CONCEPT, 'StatA');
        const b = graph.createEntity(EntityType.CONCEPT, 'StatB');
        graph.createEntity(EntityType.PERSON, 'StatC');

        graph.createRelationship(a.id, b.id, RelationType.RELATED_TO);

        const stats = graph.getStats();

        expect(stats.entityCount).toBe(3);
        expect(stats.relationshipCount).toBe(1);
        expect(stats.entityTypes[EntityType.CONCEPT]).toBe(2);
        expect(stats.entityTypes[EntityType.PERSON]).toBe(1);
      });
    });

    describe('toJSON/fromJSON', () => {
      it('should serialize and deserialize graph', () => {
        graph.createEntity(EntityType.CONCEPT, 'Test');
        const a = graph.searchEntities('Test')[0].entity;
        const b = graph.createEntity(EntityType.CONCEPT, 'Test2');
        graph.createRelationship(a.id, b.id, RelationType.RELATED_TO);

        const json = graph.toJSON();

        const newGraph = new KnowledgeGraph();
        newGraph.fromJSON(json);

        const stats = newGraph.getStats();
        expect(stats.entityCount).toBe(2);
        expect(stats.relationshipCount).toBe(1);
      });
    });

    describe('clear', () => {
      it('should remove all entities and relationships', () => {
        graph.createEntity(EntityType.CONCEPT, 'A');
        graph.createEntity(EntityType.CONCEPT, 'B');

        graph.clear();

        const stats = graph.getStats();
        expect(stats.entityCount).toBe(0);
        expect(stats.relationshipCount).toBe(0);
      });
    });
  });
});
