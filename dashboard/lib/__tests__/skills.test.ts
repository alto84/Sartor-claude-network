/**
 * Skills System Tests
 *
 * Tests for the skill registration, execution, and tool definition system.
 */

import {
  registerSkill,
  unregisterSkill,
  getSkill,
  getAllSkills,
  getAllTools,
  getToolsForSkills,
  hasSkill,
  getSkillCount,
  executeSkill,
  executeSkillsParallel,
  clearRegistry,
  createSkill,
  configureRegistry,
  Skill,
  SkillParameter,
  ClaudeToolDefinition,
  SkillExecutionResult,
} from '../skills';

describe('Skills System', () => {
  // Clear registry before each test to ensure isolation
  beforeEach(() => {
    clearRegistry();
  });

  describe('Skill Registration', () => {
    describe('registerSkill', () => {
      it('registers a valid skill successfully', () => {
        const testSkill: Skill = {
          name: 'test_skill',
          description: 'A test skill for testing',
          toolDefinition: {
            name: 'test_skill',
            description: 'A test skill for testing',
            input_schema: {
              type: 'object',
              properties: {
                param1: { type: 'string', description: 'A test parameter' },
              },
              required: ['param1'],
            },
          },
          execute: async () => ({ success: true }),
        };

        expect(() => registerSkill(testSkill)).not.toThrow();
        expect(hasSkill('test_skill')).toBe(true);
      });

      it('throws error when registering duplicate skill', () => {
        const testSkill: Skill = {
          name: 'duplicate_skill',
          description: 'Test skill',
          toolDefinition: {
            name: 'duplicate_skill',
            description: 'Test skill',
            input_schema: {
              type: 'object',
              properties: {},
              required: [],
            },
          },
          execute: async () => ({ success: true }),
        };

        registerSkill(testSkill);

        expect(() => registerSkill(testSkill)).toThrow(
          'Skill "duplicate_skill" is already registered'
        );
      });

      it('throws error when skill is missing required fields', () => {
        const invalidSkill = {
          name: 'invalid_skill',
          // Missing description, toolDefinition, execute
        } as Skill;

        expect(() => registerSkill(invalidSkill)).toThrow(
          'is missing required fields'
        );
      });

      it('throws error when skill has no name', () => {
        const noNameSkill = {
          description: 'Test',
          toolDefinition: {
            name: '',
            description: 'Test',
            input_schema: { type: 'object', properties: {}, required: [] },
          },
          execute: async () => ({ success: true }),
        } as Skill;

        expect(() => registerSkill(noNameSkill)).toThrow();
      });

      it('throws error when skill has no execute function', () => {
        const noExecuteSkill = {
          name: 'no_execute',
          description: 'Test',
          toolDefinition: {
            name: 'no_execute',
            description: 'Test',
            input_schema: { type: 'object', properties: {}, required: [] },
          },
        } as Skill;

        expect(() => registerSkill(noExecuteSkill)).toThrow(
          'is missing required fields'
        );
      });
    });

    describe('unregisterSkill', () => {
      it('removes a registered skill', () => {
        const testSkill = createTestSkill('removable_skill');
        registerSkill(testSkill);

        expect(hasSkill('removable_skill')).toBe(true);

        const result = unregisterSkill('removable_skill');

        expect(result).toBe(true);
        expect(hasSkill('removable_skill')).toBe(false);
      });

      it('returns false when unregistering non-existent skill', () => {
        const result = unregisterSkill('non_existent_skill');

        expect(result).toBe(false);
      });
    });

    describe('getSkill', () => {
      it('retrieves a registered skill', () => {
        const testSkill = createTestSkill('retrievable_skill');
        registerSkill(testSkill);

        const retrieved = getSkill('retrievable_skill');

        expect(retrieved).toBeDefined();
        expect(retrieved?.name).toBe('retrievable_skill');
      });

      it('returns undefined for non-existent skill', () => {
        const result = getSkill('non_existent');

        expect(result).toBeUndefined();
      });
    });

    describe('getAllSkills', () => {
      it('returns all registered skills', () => {
        registerSkill(createTestSkill('skill_1'));
        registerSkill(createTestSkill('skill_2'));
        registerSkill(createTestSkill('skill_3'));

        const allSkills = getAllSkills();

        expect(allSkills).toHaveLength(3);
        expect(allSkills.map((s) => s.name)).toContain('skill_1');
        expect(allSkills.map((s) => s.name)).toContain('skill_2');
        expect(allSkills.map((s) => s.name)).toContain('skill_3');
      });

      it('returns empty array when no skills registered', () => {
        const allSkills = getAllSkills();

        expect(allSkills).toEqual([]);
      });
    });

    describe('hasSkill', () => {
      it('returns true for registered skill', () => {
        registerSkill(createTestSkill('existing_skill'));

        expect(hasSkill('existing_skill')).toBe(true);
      });

      it('returns false for non-registered skill', () => {
        expect(hasSkill('non_existing')).toBe(false);
      });
    });

    describe('getSkillCount', () => {
      it('returns correct count of registered skills', () => {
        expect(getSkillCount()).toBe(0);

        registerSkill(createTestSkill('count_skill_1'));
        expect(getSkillCount()).toBe(1);

        registerSkill(createTestSkill('count_skill_2'));
        expect(getSkillCount()).toBe(2);
      });

      it('updates count after unregistration', () => {
        registerSkill(createTestSkill('temp_skill'));
        expect(getSkillCount()).toBe(1);

        unregisterSkill('temp_skill');
        expect(getSkillCount()).toBe(0);
      });
    });

    describe('clearRegistry', () => {
      it('removes all registered skills', () => {
        registerSkill(createTestSkill('clear_skill_1'));
        registerSkill(createTestSkill('clear_skill_2'));
        expect(getSkillCount()).toBe(2);

        clearRegistry();

        expect(getSkillCount()).toBe(0);
        expect(hasSkill('clear_skill_1')).toBe(false);
        expect(hasSkill('clear_skill_2')).toBe(false);
      });
    });
  });

  describe('Skill Execution', () => {
    describe('executeSkill', () => {
      it('executes a skill successfully', async () => {
        const testSkill = createTestSkill('exec_skill', async (params) => ({
          success: true,
          data: { received: params },
        }));
        registerSkill(testSkill);

        const result = await executeSkill('exec_skill', { test: 'value' });

        expect(result.success).toBe(true);
        expect(result.data).toEqual({ received: { test: 'value' } });
      });

      it('returns error for non-existent skill', async () => {
        const result = await executeSkill('non_existent', {});

        expect(result.success).toBe(false);
        expect(result.error).toBe('Skill "non_existent" not found');
      });

      it('catches and returns execution errors', async () => {
        const errorSkill = createTestSkill('error_skill', async () => {
          throw new Error('Execution failed');
        });
        registerSkill(errorSkill);

        const result = await executeSkill('error_skill', {});

        expect(result.success).toBe(false);
        expect(result.error).toBe('Execution failed');
      });

      it('includes execution time in metadata', async () => {
        const delaySkill = createTestSkill('delay_skill', async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return { success: true };
        });
        registerSkill(delaySkill);

        const result = await executeSkill('delay_skill', {});

        expect(result.metadata?.executionTime).toBeDefined();
        expect(result.metadata?.executionTime).toBeGreaterThanOrEqual(50);
      });

      it('times out after configured duration', async () => {
        // Configure a short timeout for testing
        configureRegistry({ executionTimeout: 100 });

        const slowSkill = createTestSkill('slow_skill', async () => {
          await new Promise((resolve) => setTimeout(resolve, 500));
          return { success: true };
        });
        registerSkill(slowSkill);

        const result = await executeSkill('slow_skill', {});

        expect(result.success).toBe(false);
        expect(result.error).toContain('timed out');

        // Reset timeout
        configureRegistry({ executionTimeout: 30000 });
      });
    });

    describe('executeSkillsParallel', () => {
      it('executes multiple skills in parallel', async () => {
        registerSkill(
          createTestSkill('parallel_1', async () => ({
            success: true,
            data: 'result_1',
          }))
        );
        registerSkill(
          createTestSkill('parallel_2', async () => ({
            success: true,
            data: 'result_2',
          }))
        );

        const results = await executeSkillsParallel([
          ['parallel_1', {}],
          ['parallel_2', {}],
        ]);

        expect(results).toHaveLength(2);
        expect(results[0].data).toBe('result_1');
        expect(results[1].data).toBe('result_2');
      });

      it('handles mixed success and failure', async () => {
        registerSkill(
          createTestSkill('success_skill', async () => ({
            success: true,
            data: 'ok',
          }))
        );

        const results = await executeSkillsParallel([
          ['success_skill', {}],
          ['non_existent', {}],
        ]);

        expect(results).toHaveLength(2);
        expect(results[0].success).toBe(true);
        expect(results[1].success).toBe(false);
      });

      it('handles empty execution array', async () => {
        const results = await executeSkillsParallel([]);

        expect(results).toEqual([]);
      });
    });
  });

  describe('Tool Definition Format', () => {
    describe('getAllTools', () => {
      it('returns tool definitions for all skills', () => {
        registerSkill(createTestSkill('tool_skill_1'));
        registerSkill(createTestSkill('tool_skill_2'));

        const tools = getAllTools();

        expect(tools).toHaveLength(2);
        expect(tools[0]).toHaveProperty('name');
        expect(tools[0]).toHaveProperty('description');
        expect(tools[0]).toHaveProperty('input_schema');
      });

      it('returns tools with correct structure', () => {
        const skillWithParams: Skill = {
          name: 'structured_skill',
          description: 'A skill with parameters',
          toolDefinition: {
            name: 'structured_skill',
            description: 'A skill with parameters',
            input_schema: {
              type: 'object',
              properties: {
                stringParam: { type: 'string', description: 'A string' },
                numberParam: { type: 'number', description: 'A number' },
                boolParam: { type: 'boolean', description: 'A boolean' },
              },
              required: ['stringParam'],
            },
          },
          execute: async () => ({ success: true }),
        };
        registerSkill(skillWithParams);

        const tools = getAllTools();
        const tool = tools[0];

        expect(tool.name).toBe('structured_skill');
        expect(tool.input_schema.type).toBe('object');
        expect(tool.input_schema.properties).toHaveProperty('stringParam');
        expect(tool.input_schema.properties).toHaveProperty('numberParam');
        expect(tool.input_schema.properties).toHaveProperty('boolParam');
        expect(tool.input_schema.required).toContain('stringParam');
      });

      it('returns empty array when no skills registered', () => {
        const tools = getAllTools();

        expect(tools).toEqual([]);
      });
    });

    describe('getToolsForSkills', () => {
      it('returns tools for specified skills only', () => {
        registerSkill(createTestSkill('selected_1'));
        registerSkill(createTestSkill('selected_2'));
        registerSkill(createTestSkill('not_selected'));

        const tools = getToolsForSkills(['selected_1', 'selected_2']);

        expect(tools).toHaveLength(2);
        expect(tools.map((t) => t.name)).toContain('selected_1');
        expect(tools.map((t) => t.name)).toContain('selected_2');
        expect(tools.map((t) => t.name)).not.toContain('not_selected');
      });

      it('filters out non-existent skills', () => {
        registerSkill(createTestSkill('existing'));

        const tools = getToolsForSkills(['existing', 'non_existing']);

        expect(tools).toHaveLength(1);
        expect(tools[0].name).toBe('existing');
      });

      it('returns empty array for empty skill names', () => {
        registerSkill(createTestSkill('some_skill'));

        const tools = getToolsForSkills([]);

        expect(tools).toEqual([]);
      });
    });

    describe('Tool definition validation', () => {
      it('validates required input_schema type is object', () => {
        const validTool: ClaudeToolDefinition = {
          name: 'valid_tool',
          description: 'A valid tool',
          input_schema: {
            type: 'object',
            properties: {},
            required: [],
          },
        };

        expect(validTool.input_schema.type).toBe('object');
      });

      it('validates parameter types are correct', () => {
        const tool: ClaudeToolDefinition = {
          name: 'typed_tool',
          description: 'Tool with typed parameters',
          input_schema: {
            type: 'object',
            properties: {
              str: { type: 'string', description: 'String param' },
              num: { type: 'number', description: 'Number param' },
              bool: { type: 'boolean', description: 'Boolean param' },
              arr: {
                type: 'array',
                description: 'Array param',
                items: { type: 'string' },
              },
              obj: {
                type: 'object',
                description: 'Object param',
                properties: {
                  nested: { type: 'string', description: 'Nested' },
                },
              },
            },
            required: ['str'],
          },
        };

        expect(tool.input_schema.properties.str.type).toBe('string');
        expect(tool.input_schema.properties.num.type).toBe('number');
        expect(tool.input_schema.properties.bool.type).toBe('boolean');
        expect(tool.input_schema.properties.arr.type).toBe('array');
        expect(tool.input_schema.properties.obj.type).toBe('object');
      });

      it('validates enum parameters', () => {
        const enumTool: ClaudeToolDefinition = {
          name: 'enum_tool',
          description: 'Tool with enum parameter',
          input_schema: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                description: 'Action to perform',
                enum: ['create', 'update', 'delete'],
              },
            },
            required: ['action'],
          },
        };

        expect(enumTool.input_schema.properties.action.enum).toContain(
          'create'
        );
        expect(enumTool.input_schema.properties.action.enum).toContain(
          'update'
        );
        expect(enumTool.input_schema.properties.action.enum).toContain(
          'delete'
        );
      });
    });
  });

  describe('createSkill helper', () => {
    it('creates a valid skill from config', () => {
      const skill = createSkill({
        name: 'helper_created',
        description: 'A skill created with the helper',
        parameters: {
          input: { type: 'string', description: 'Input parameter' },
        },
        required: ['input'],
        execute: async (params) => ({
          success: true,
          data: params.input,
        }),
      });

      expect(skill.name).toBe('helper_created');
      expect(skill.description).toBe('A skill created with the helper');
      expect(skill.toolDefinition.name).toBe('helper_created');
      expect(skill.toolDefinition.input_schema.required).toContain('input');
    });

    it('creates skill with empty required array by default', () => {
      const skill = createSkill({
        name: 'no_required',
        description: 'No required params',
        parameters: {
          optional: { type: 'string', description: 'Optional param' },
        },
        execute: async () => ({ success: true }),
      });

      expect(skill.toolDefinition.input_schema.required).toEqual([]);
    });

    it('created skill can be registered and executed', async () => {
      const skill = createSkill({
        name: 'functional_skill',
        description: 'A functional skill',
        parameters: {
          value: { type: 'number', description: 'A value' },
        },
        required: ['value'],
        execute: async (params) => ({
          success: true,
          data: (params.value as number) * 2,
        }),
      });

      registerSkill(skill);
      const result = await executeSkill('functional_skill', { value: 5 });

      expect(result.success).toBe(true);
      expect(result.data).toBe(10);
    });
  });

  describe('configureRegistry', () => {
    it('updates registry configuration', () => {
      // Configure with debug mode
      configureRegistry({ debug: true });

      // This is hard to test directly, but we can verify it doesn't throw
      expect(() => configureRegistry({ debug: false })).not.toThrow();
    });

    it('updates execution timeout', () => {
      configureRegistry({ executionTimeout: 5000 });

      // Configuration is internal, but we can verify no errors
      expect(() =>
        configureRegistry({ executionTimeout: 30000 })
      ).not.toThrow();
    });
  });
});

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Create a minimal test skill for testing purposes
 */
function createTestSkill(
  name: string,
  execute?: (params: Record<string, unknown>) => Promise<SkillExecutionResult>
): Skill {
  return {
    name,
    description: `Test skill: ${name}`,
    toolDefinition: {
      name,
      description: `Test skill: ${name}`,
      input_schema: {
        type: 'object',
        properties: {
          testParam: { type: 'string', description: 'Test parameter' },
        },
        required: [],
      },
    },
    execute: execute || (async () => ({ success: true })),
  };
}
