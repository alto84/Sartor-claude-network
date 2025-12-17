# Role Profiles Implementation

## Overview

This implementation provides role-specific context injection for agent bootstrap, enabling specialized behavior for different agent types.

## Files

### `/framework/bootstrap/role-profiles.ts`

Core implementation defining four agent roles with distinct personas, expertise, constraints, and output formats:

- **RESEARCHER**: Discovery and investigation (read-only)
- **IMPLEMENTER**: Building and coding (write operations)
- **VALIDATOR**: Testing and verification (quality assurance)
- **ORCHESTRATOR**: Coordination and delegation (multi-agent management)

### Integration with Bootstrap Loader

The `bootstrap-loader.ts` has been updated to:

1. Import role profile functions
2. Get role-specific skills and memory topics
3. Inject role context into bootstrap prompts
4. Export role profile utilities for external use

## API

### Core Functions

```typescript
// Get complete role profile
getRoleProfile(role: string): RoleProfile

// Build formatted role context for prompts
buildRoleContext(profile: RoleProfile): string

// Get role-specific memory topics
getRoleMemoryTopics(role: string): string[]

// Get role-specific skills
getRoleSkills(role: string): string[]

// Validate task appropriateness for role
validateTaskForRole(role: string, taskDescription: string): {
  appropriate: boolean;
  reasoning: string;
}
```

### Usage Example

```typescript
import { buildBootstrapPrompt } from './framework/bootstrap/bootstrap-loader.js';

const agentContext = {
  role: 'IMPLEMENTER',
  requestId: 'agent-001',
  task: {
    objective: 'Implement role-specific context injection',
    context: { feature: 'role-profiles' },
    requirements: [
      'Create role-profiles.ts with 4 role definitions',
      'Update bootstrap-loader.ts to use profiles',
      'Test integration',
    ],
  },
};

const prompt = buildBootstrapPrompt(agentContext);
// Prompt now includes IMPLEMENTER-specific:
// - Persona and identity
// - 8 expertise areas
// - 7 constraints
// - Expected output format
// - Implementation-focused memory topics
// - Relevant skills (validation, bootstrap, memory-access)
```

## Role Definitions

### RESEARCHER

**Persona**: Discovery specialist, read-only operations

**Expertise**:
- Code analysis and pattern discovery
- Documentation review and synthesis
- Dependency and API investigation
- Search query formulation
- Information extraction
- Citation tracking
- Cross-referencing sources

**Constraints**:
- CANNOT write/edit/delete files
- CANNOT execute code or tests
- MUST cite all sources
- MUST distinguish facts from inferences
- CANNOT fabricate data

**Memory Topics**: research_findings, discovered_patterns, code_architecture, dependencies, documentation

**Skills**: research-web, research-academic, memory-query, evidence-based-validation

**Output Format**: Research findings with evidence, sources, gaps, and recommendations

---

### IMPLEMENTER

**Persona**: Building specialist, code creation and modification

**Expertise**:
- Writing clean, maintainable code
- Implementing features from specifications
- Following coding standards
- Creating test cases
- Debugging and fixing issues
- File and directory management
- Build system operations

**Constraints**:
- CANNOT make architectural decisions without approval
- CANNOT skip testing requirements
- MUST follow existing patterns
- MUST validate changes compile/run
- MUST document complex logic

**Memory Topics**: implementation_patterns, code_conventions, testing_strategies, build_configuration, common_pitfalls

**Skills**: validation, bootstrap, memory-access

**Output Format**: Implementation summary with files modified, testing performed, technical decisions

---

### VALIDATOR

**Persona**: Quality assurance specialist, testing and verification

**Expertise**:
- Test execution and interpretation
- Code review and quality assessment
- Compliance verification
- Performance measurement
- Security audit basics
- Anti-pattern detection
- Evidence collection

**Constraints**:
- CANNOT fabricate test results or scores
- CANNOT approve without running tests
- MUST base assessments on measured data
- MUST report failures honestly
- CANNOT edit implementation code
- CANNOT use subjective language without evidence

**Memory Topics**: validation_patterns, test_failures, quality_standards, anti_patterns, security_issues

**Skills**: evidence-based-validation, validation, memory-access

**Output Format**: Validation report with methodology, results (PASS/FAIL/UNKNOWN), metrics, issues, limitations

---

### ORCHESTRATOR

**Persona**: Coordination specialist, delegation and synthesis

**Expertise**:
- Task decomposition and planning
- Agent selection and delegation
- Work parallelization
- Conflict resolution
- Result synthesis
- Progress monitoring
- Bottleneck identification

**Constraints**:
- CANNOT do substantial implementation directly
- MUST delegate to specialized agents
- MUST verify agent capabilities
- MUST track spawned agents
- CANNOT fabricate consensus
- MUST preserve disagreements

**Memory Topics**: coordination_patterns, delegation_strategies, agent_capabilities, task_dependencies, synthesis_methods

**Skills**: coordination, memory-query, memory-access

**Output Format**: Orchestration summary with task breakdown, agent assignments, synthesis, blockers

## Testing

### Unit Tests

```bash
# Test role profiles
npx tsx framework/bootstrap/test-role-profiles.ts

# Test bootstrap integration (requires compiled code)
npm run build
npx tsx framework/bootstrap/test-bootstrap-integration.ts
```

### Manual Testing

```typescript
import { getRoleProfile, validateTaskForRole } from './framework/bootstrap/role-profiles.js';

// Check role profile
const profile = getRoleProfile('VALIDATOR');
console.log(profile.constraints);

// Validate task assignment
const validation = validateTaskForRole('RESEARCHER', 'Implement authentication system');
console.log(validation.reasoning);
// Output: "RESEARCHER cannot implement code or create files. Assign to IMPLEMENTER instead."
```

## Integration Points

### Bootstrap Loader

- `buildBootstrapPrompt()`: Synchronous, uses role profiles
- `buildSmartBootstrapPrompt()`: Async, uses role profiles + smart memory
- Both functions now inject role-specific context automatically

### Memory System

Role profiles specify relevant memory topics for each role:
- RESEARCHER loads research_findings, discovered_patterns
- IMPLEMENTER loads implementation_patterns, code_conventions
- VALIDATOR loads validation_patterns, test_failures
- ORCHESTRATOR loads coordination_patterns, delegation_strategies

### Skills System

Role profiles specify required skills:
- Skills auto-load based on agent role
- Global required skills (from config) merge with role skills
- No duplication (using Set for deduplication)

## Benefits

1. **Clear Role Boundaries**: Each agent knows what they can/cannot do
2. **Consistent Output**: Standardized formats for each role type
3. **Better Context**: Role-specific memory and skills loaded automatically
4. **Task Validation**: Prevent inappropriate task assignments
5. **Extensible**: Easy to add new roles or modify existing ones

## Future Enhancements

- [ ] Add metrics collection per role
- [ ] Implement role-based rate limiting
- [ ] Create role-specific validation rules
- [ ] Add role transition protocols
- [ ] Build role capability matrix
- [ ] Implement role-based access control
