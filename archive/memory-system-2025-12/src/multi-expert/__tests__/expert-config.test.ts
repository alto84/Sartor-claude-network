/**
 * Tests for Expert Configuration System
 *
 * Validates expert archetypes, configuration creation, validation,
 * and serialization for multi-expert parallel execution.
 */

import {
  ExpertArchetype,
  ExpertStrategy,
  ExpertConfig,
  DEFAULT_EXPERT_CONFIG,
  EXPERT_ARCHETYPES,
  createExpertConfig,
  createExpertPool,
  validateExpertConfig,
  serializeExpertConfig,
  deserializeExpertConfig,
} from '../expert-config';

describe('ExpertConfig', () => {
  describe('Default Configuration', () => {
    test('provides sensible defaults', () => {
      expect(DEFAULT_EXPERT_CONFIG.archetype).toBe('balanced');
      expect(DEFAULT_EXPERT_CONFIG.strategy).toBe('analytical');
      expect(DEFAULT_EXPERT_CONFIG.temperature).toBe(0.5);
      expect(DEFAULT_EXPERT_CONFIG.maxIterations).toBe(3);
      expect(DEFAULT_EXPERT_CONFIG.minIterations).toBe(1);
      expect(DEFAULT_EXPERT_CONFIG.votingWeight).toBe(1.0);
      expect(DEFAULT_EXPERT_CONFIG.selectionProbability).toBe(1.0);
    });

    test('has valid timeout values', () => {
      expect(DEFAULT_EXPERT_CONFIG.taskTimeout).toBe(30000);
      expect(DEFAULT_EXPERT_CONFIG.totalTimeout).toBe(120000);
      expect(DEFAULT_EXPERT_CONFIG.totalTimeout).toBeGreaterThan(
        DEFAULT_EXPERT_CONFIG.taskTimeout
      );
    });

    test('has valid threshold values', () => {
      expect(DEFAULT_EXPERT_CONFIG.confidenceThreshold).toBe(0.7);
      expect(DEFAULT_EXPERT_CONFIG.satisfactionThreshold).toBe(0.85);
      expect(DEFAULT_EXPERT_CONFIG.confidenceThreshold).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_EXPERT_CONFIG.confidenceThreshold).toBeLessThanOrEqual(1);
      expect(DEFAULT_EXPERT_CONFIG.satisfactionThreshold).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_EXPERT_CONFIG.satisfactionThreshold).toBeLessThanOrEqual(1);
    });
  });

  describe('Expert Archetypes', () => {
    test('performance archetype optimizes for speed', () => {
      const perf = EXPERT_ARCHETYPES.performance;
      expect(perf.archetype).toBe('performance');
      expect(perf.strategy).toBe('aggressive');
      expect(perf.temperature).toBe(0.3); // Lower temperature for consistency
      expect(perf.maxIterations).toBe(2); // Fewer iterations
      expect(perf.preferLowIterations).toBe(true);
      expect(perf.constraints).toContain('minimize-latency');
    });

    test('safety archetype prioritizes correctness', () => {
      const safety = EXPERT_ARCHETYPES.safety;
      expect(safety.archetype).toBe('safety');
      expect(safety.strategy).toBe('conservative');
      expect(safety.temperature).toBe(0.2); // Very low temperature
      expect(safety.maxIterations).toBe(5); // More iterations for validation
      expect(safety.minIterations).toBe(2);
      expect(safety.confidenceThreshold).toBe(0.85);
      expect(safety.satisfactionThreshold).toBe(0.9);
      expect(safety.constraints).toContain('validate-all-inputs');
      expect(safety.constraints).toContain('handle-all-errors');
    });

    test('simplicity archetype favors readability', () => {
      const simplicity = EXPERT_ARCHETYPES.simplicity;
      expect(simplicity.archetype).toBe('simplicity');
      expect(simplicity.strategy).toBe('conservative');
      expect(simplicity.temperature).toBe(0.4);
      expect(simplicity.constraints).toContain('prefer-readable-code');
      expect(simplicity.constraints).toContain('avoid-complexity');
      expect(simplicity.constraints).toContain('minimal-dependencies');
    });

    test('robustness archetype handles edge cases', () => {
      const robustness = EXPERT_ARCHETYPES.robustness;
      expect(robustness.archetype).toBe('robustness');
      expect(robustness.strategy).toBe('analytical');
      expect(robustness.temperature).toBe(0.4);
      expect(robustness.maxIterations).toBe(4);
      expect(robustness.minIterations).toBe(2);
      expect(robustness.retriesPerIteration).toBe(3);
      expect(robustness.constraints).toContain('handle-edge-cases');
      expect(robustness.constraints).toContain('graceful-degradation');
    });

    test('creative archetype explores alternatives', () => {
      const creative = EXPERT_ARCHETYPES.creative;
      expect(creative.archetype).toBe('creative');
      expect(creative.strategy).toBe('exploratory');
      expect(creative.temperature).toBe(0.8); // High temperature for creativity
      expect(creative.maxIterations).toBe(4);
      expect(creative.preferLowIterations).toBe(false);
      expect(creative.constraints).toContain('explore-alternatives');
      expect(creative.constraints).toContain('unconventional-approaches');
    });

    test('balanced archetype is well-rounded', () => {
      const balanced = EXPERT_ARCHETYPES.balanced;
      expect(balanced.archetype).toBe('balanced');
      expect(balanced.strategy).toBe('analytical');
      expect(balanced.temperature).toBe(0.5);
      expect(balanced.maxIterations).toBe(3);
      expect(balanced.constraints).toEqual([]);
    });

    test('all archetypes are defined', () => {
      const archetypes: ExpertArchetype[] = [
        'performance',
        'safety',
        'simplicity',
        'robustness',
        'creative',
        'balanced',
      ];
      archetypes.forEach((archetype) => {
        expect(EXPERT_ARCHETYPES[archetype]).toBeDefined();
        expect(EXPERT_ARCHETYPES[archetype].archetype).toBe(archetype);
      });
    });
  });

  describe('createExpertConfig', () => {
    test('creates config with defaults', () => {
      const config = createExpertConfig('test-1', 'Test Expert');
      expect(config.id).toBe('test-1');
      expect(config.name).toBe('Test Expert');
      expect(config.archetype).toBe('balanced');
      expect(config.createdAt).toBeDefined();
    });

    test('applies archetype defaults', () => {
      const config = createExpertConfig('perf-1', 'Performance Expert', 'performance');
      expect(config.archetype).toBe('performance');
      expect(config.strategy).toBe('aggressive');
      expect(config.temperature).toBe(0.3);
      expect(config.constraints).toContain('minimize-latency');
    });

    test('allows custom overrides', () => {
      const config = createExpertConfig('custom-1', 'Custom Expert', 'safety', {
        temperature: 0.15,
        maxIterations: 10,
        constraints: ['extra-safe'],
      });
      expect(config.temperature).toBe(0.15);
      expect(config.maxIterations).toBe(10);
      expect(config.constraints).toEqual(['extra-safe']);
    });

    test('sets createdAt timestamp', () => {
      const before = new Date().toISOString();
      const config = createExpertConfig('time-1', 'Time Test');
      const after = new Date().toISOString();
      expect(config.createdAt).toBeDefined();
      expect(config.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(config.createdAt >= before && config.createdAt <= after).toBe(true);
    });

    test('maintains version info', () => {
      const config = createExpertConfig('ver-1', 'Version Test');
      expect(config.version).toBe('1.0.0');
    });
  });

  describe('createExpertPool', () => {
    test('creates multiple experts from archetypes', () => {
      const pool = createExpertPool('pool-1', ['performance', 'safety', 'simplicity']);
      expect(pool).toHaveLength(3);
      expect(pool[0].archetype).toBe('performance');
      expect(pool[1].archetype).toBe('safety');
      expect(pool[2].archetype).toBe('simplicity');
    });

    test('generates unique IDs for each expert', () => {
      const pool = createExpertPool('pool-2', ['balanced', 'balanced', 'balanced']);
      const ids = pool.map((e) => e.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
      expect(ids[0]).toContain('pool-2');
      expect(ids[1]).toContain('pool-2');
      expect(ids[2]).toContain('pool-2');
    });

    test('generates appropriate names', () => {
      const pool = createExpertPool('test', ['performance', 'safety']);
      expect(pool[0].name).toBe('Performance Expert 1');
      expect(pool[1].name).toBe('Safety Expert 2');
    });

    test('applies seed variation when provided', () => {
      const pool = createExpertPool('seed-test', ['balanced', 'balanced'], 42);
      expect(pool[0].seed).toBe(42);
      expect(pool[1].seed).toBe(43);
    });

    test('leaves seed undefined when not provided', () => {
      const pool = createExpertPool('no-seed', ['balanced']);
      expect(pool[0].seed).toBeUndefined();
    });

    test('handles empty archetype array', () => {
      const pool = createExpertPool('empty', []);
      expect(pool).toHaveLength(0);
    });

    test('creates diverse pool with all archetypes', () => {
      const pool = createExpertPool('diverse', [
        'performance',
        'safety',
        'simplicity',
        'robustness',
        'creative',
        'balanced',
      ]);
      expect(pool).toHaveLength(6);
      const archetypes = pool.map((e) => e.archetype);
      expect(new Set(archetypes).size).toBe(6);
    });
  });

  describe('validateExpertConfig', () => {
    test('validates correct configuration', () => {
      const config = createExpertConfig('valid-1', 'Valid Expert');
      const result = validateExpertConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('rejects missing id', () => {
      const config = createExpertConfig('test', 'Test');
      config.id = '';
      const result = validateExpertConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('id is required');
    });

    test('rejects missing name', () => {
      const config = createExpertConfig('test', 'Test');
      config.name = '';
      const result = validateExpertConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('name is required');
    });

    test('rejects invalid temperature range', () => {
      const config1 = createExpertConfig('test', 'Test', 'balanced', { temperature: -0.1 });
      const result1 = validateExpertConfig(config1);
      expect(result1.valid).toBe(false);
      expect(result1.errors).toContain('temperature must be 0-1');

      const config2 = createExpertConfig('test', 'Test', 'balanced', { temperature: 1.1 });
      const result2 = validateExpertConfig(config2);
      expect(result2.valid).toBe(false);
      expect(result2.errors).toContain('temperature must be 0-1');
    });

    test('rejects invalid iteration counts', () => {
      const config1 = createExpertConfig('test', 'Test', 'balanced', { maxIterations: 0 });
      const result1 = validateExpertConfig(config1);
      expect(result1.valid).toBe(false);
      expect(result1.errors).toContain('maxIterations must be >= 1');

      const config2 = createExpertConfig('test', 'Test', 'balanced', {
        minIterations: 5,
        maxIterations: 3,
      });
      const result2 = validateExpertConfig(config2);
      expect(result2.valid).toBe(false);
      expect(result2.errors).toContain('minIterations cannot exceed maxIterations');
    });

    test('rejects invalid confidence threshold', () => {
      const config1 = createExpertConfig('test', 'Test', 'balanced', {
        confidenceThreshold: -0.1,
      });
      const result1 = validateExpertConfig(config1);
      expect(result1.valid).toBe(false);
      expect(result1.errors).toContain('confidenceThreshold must be 0-1');

      const config2 = createExpertConfig('test', 'Test', 'balanced', {
        confidenceThreshold: 1.5,
      });
      const result2 = validateExpertConfig(config2);
      expect(result2.valid).toBe(false);
      expect(result2.errors).toContain('confidenceThreshold must be 0-1');
    });

    test('rejects invalid satisfaction threshold', () => {
      const config = createExpertConfig('test', 'Test', 'balanced', {
        satisfactionThreshold: 2.0,
      });
      const result = validateExpertConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('satisfactionThreshold must be 0-1');
    });

    test('rejects invalid voting weight', () => {
      const config = createExpertConfig('test', 'Test', 'balanced', { votingWeight: 1.5 });
      const result = validateExpertConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('votingWeight must be 0-1');
    });

    test('rejects invalid selection probability', () => {
      const config = createExpertConfig('test', 'Test', 'balanced', {
        selectionProbability: -0.5,
      });
      const result = validateExpertConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('selectionProbability must be 0-1');
    });

    test('rejects invalid timeout values', () => {
      const config1 = createExpertConfig('test', 'Test', 'balanced', { taskTimeout: 500 });
      const result1 = validateExpertConfig(config1);
      expect(result1.valid).toBe(false);
      expect(result1.errors).toContain('taskTimeout must be >= 1000ms');

      const config2 = createExpertConfig('test', 'Test', 'balanced', {
        taskTimeout: 60000,
        totalTimeout: 30000,
      });
      const result2 = validateExpertConfig(config2);
      expect(result2.valid).toBe(false);
      expect(result2.errors).toContain('totalTimeout must be >= taskTimeout');
    });

    test('accumulates multiple errors', () => {
      const config = createExpertConfig('test', 'Test', 'balanced', {
        temperature: 2.0,
        maxIterations: 0,
        confidenceThreshold: -0.5,
      });
      const result = validateExpertConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });

    test('validates all archetypes successfully', () => {
      const archetypes: ExpertArchetype[] = [
        'performance',
        'safety',
        'simplicity',
        'robustness',
        'creative',
        'balanced',
      ];
      archetypes.forEach((archetype) => {
        const config = createExpertConfig(`test-${archetype}`, 'Test', archetype);
        const result = validateExpertConfig(config);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });

  describe('serializeExpertConfig', () => {
    test('serializes to JSON string', () => {
      const config = createExpertConfig('ser-1', 'Serialize Test');
      const serialized = serializeExpertConfig(config);
      expect(typeof serialized).toBe('string');
      expect(() => JSON.parse(serialized)).not.toThrow();
    });

    test('preserves all properties', () => {
      const config = createExpertConfig('ser-2', 'Complete Test', 'performance', {
        temperature: 0.35,
        constraints: ['test-constraint'],
        tags: ['test-tag'],
      });
      const serialized = serializeExpertConfig(config);
      const parsed = JSON.parse(serialized);
      expect(parsed.id).toBe('ser-2');
      expect(parsed.name).toBe('Complete Test');
      expect(parsed.archetype).toBe('performance');
      expect(parsed.temperature).toBe(0.35);
      expect(parsed.constraints).toContain('test-constraint');
      expect(parsed.tags).toContain('test-tag');
    });

    test('formats JSON with indentation', () => {
      const config = createExpertConfig('ser-3', 'Format Test');
      const serialized = serializeExpertConfig(config);
      expect(serialized).toContain('\n');
      expect(serialized).toContain('  '); // Indentation
    });
  });

  describe('deserializeExpertConfig', () => {
    test('deserializes valid JSON', () => {
      const original = createExpertConfig('deser-1', 'Deserialize Test');
      const serialized = serializeExpertConfig(original);
      const deserialized = deserializeExpertConfig(serialized);
      expect(deserialized.id).toBe(original.id);
      expect(deserialized.name).toBe(original.name);
      expect(deserialized.archetype).toBe(original.archetype);
    });

    test('validates during deserialization', () => {
      const invalidJson = JSON.stringify({
        id: 'test',
        name: 'Test',
        temperature: 5.0, // Invalid
      });
      expect(() => deserializeExpertConfig(invalidJson)).toThrow('Invalid expert config');
    });

    test('throws on invalid JSON syntax', () => {
      expect(() => deserializeExpertConfig('not valid json')).toThrow();
    });

    test('round-trip preserves data', () => {
      const original = createExpertConfig('round-1', 'Round Trip', 'creative', {
        temperature: 0.75,
        maxIterations: 5,
        constraints: ['a', 'b', 'c'],
        tags: ['tag1', 'tag2'],
        seed: 12345,
      });
      const serialized = serializeExpertConfig(original);
      const deserialized = deserializeExpertConfig(serialized);
      expect(deserialized).toEqual(original);
    });

    test('handles all archetypes', () => {
      const archetypes: ExpertArchetype[] = [
        'performance',
        'safety',
        'simplicity',
        'robustness',
        'creative',
        'balanced',
      ];
      archetypes.forEach((archetype) => {
        const config = createExpertConfig(`deser-${archetype}`, 'Test', archetype);
        const serialized = serializeExpertConfig(config);
        const deserialized = deserializeExpertConfig(serialized);
        expect(deserialized.archetype).toBe(archetype);
      });
    });
  });

  describe('Integration Scenarios', () => {
    test('creates and validates diverse expert pool', () => {
      const pool = createExpertPool('integration-1', [
        'performance',
        'safety',
        'robustness',
      ]);
      pool.forEach((expert) => {
        const validation = validateExpertConfig(expert);
        expect(validation.valid).toBe(true);
      });
    });

    test('serializes and deserializes pool', () => {
      const pool = createExpertPool('integration-2', ['balanced', 'creative']);
      const serializedPool = pool.map(serializeExpertConfig);
      const deserializedPool = serializedPool.map(deserializeExpertConfig);
      expect(deserializedPool).toHaveLength(pool.length);
      deserializedPool.forEach((expert, i) => {
        expect(expert.id).toBe(pool[i].id);
        expect(expert.archetype).toBe(pool[i].archetype);
      });
    });

    test('custom configuration with validation', () => {
      const custom = createExpertConfig('custom-integration', 'Custom', 'balanced', {
        temperature: 0.6,
        maxIterations: 4,
        minIterations: 2,
        taskTimeout: 45000,
        totalTimeout: 180000,
        confidenceThreshold: 0.75,
        constraints: ['custom-rule-1', 'custom-rule-2'],
      });
      const validation = validateExpertConfig(custom);
      expect(validation.valid).toBe(true);
      const serialized = serializeExpertConfig(custom);
      const deserialized = deserializeExpertConfig(serialized);
      expect(deserialized.constraints).toEqual(['custom-rule-1', 'custom-rule-2']);
    });

    test('archetype characteristics are preserved through serialization', () => {
      const safety = createExpertConfig('safety-test', 'Safety Expert', 'safety');
      const serialized = serializeExpertConfig(safety);
      const deserialized = deserializeExpertConfig(serialized);
      expect(deserialized.strategy).toBe('conservative');
      expect(deserialized.minIterations).toBe(2);
      expect(deserialized.confidenceThreshold).toBe(0.85);
    });
  });

  describe('Edge Cases', () => {
    test('handles empty constraints and tags', () => {
      const config = createExpertConfig('empty-1', 'Empty', 'balanced', {
        constraints: [],
        tags: [],
      });
      const validation = validateExpertConfig(config);
      expect(validation.valid).toBe(true);
    });

    test('handles very long constraint lists', () => {
      const constraints = Array.from({ length: 100 }, (_, i) => `constraint-${i}`);
      const config = createExpertConfig('long-1', 'Long', 'balanced', { constraints });
      const validation = validateExpertConfig(config);
      expect(validation.valid).toBe(true);
      expect(config.constraints).toHaveLength(100);
    });

    test('handles boundary temperature values', () => {
      const config1 = createExpertConfig('temp-0', 'Zero Temp', 'balanced', {
        temperature: 0.0,
      });
      expect(validateExpertConfig(config1).valid).toBe(true);

      const config2 = createExpertConfig('temp-1', 'Max Temp', 'balanced', {
        temperature: 1.0,
      });
      expect(validateExpertConfig(config2).valid).toBe(true);
    });

    test('handles boundary threshold values', () => {
      const config = createExpertConfig('threshold-test', 'Threshold', 'balanced', {
        confidenceThreshold: 0.0,
        satisfactionThreshold: 1.0,
      });
      expect(validateExpertConfig(config).valid).toBe(true);
    });

    test('handles minimum timeout values', () => {
      const config = createExpertConfig('timeout-min', 'Min Timeout', 'balanced', {
        taskTimeout: 1000,
        totalTimeout: 1000,
      });
      expect(validateExpertConfig(config).valid).toBe(true);
    });

    test('handles very large seed values', () => {
      const config = createExpertConfig('seed-large', 'Large Seed', 'balanced', {
        seed: Number.MAX_SAFE_INTEGER,
      });
      const serialized = serializeExpertConfig(config);
      const deserialized = deserializeExpertConfig(serialized);
      expect(deserialized.seed).toBe(Number.MAX_SAFE_INTEGER);
    });
  });
});
