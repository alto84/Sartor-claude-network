# Anthropic Research: Claude Code, API Best Practices, and Multi-Agent Patterns

**Research Date:** 2025-12-15
**Researcher:** Anthropic Research Agent
**Focus:** Official documentation, best practices, and implementation patterns

---

## Table of Contents
1. [Claude Code Overview](#claude-code-overview)
2. [Claude API Best Practices](#claude-api-best-practices)
3. [Tool Use Patterns](#tool-use-patterns)
4. [Multi-Agent Architecture](#multi-agent-architecture)
5. [Agent Skills Framework](#agent-skills-framework)
6. [Model Context Protocol (MCP)](#model-context-protocol-mcp)
7. [Context Management Strategies](#context-management-strategies)
8. [Implementation Recommendations](#implementation-recommendations)

---

## Claude Code Overview

### Core Capabilities

Claude Code is an agentic coding tool that operates directly in the terminal, enabling developers to build, debug, and maintain code through natural language interactions.

**Key Features:**
- **Build Features from Descriptions**: Write code from plain English specifications
- **Debug and Fix Issues**: Paste error messages or describe bugs for automated fixes
- **Navigate Any Codebase**: Query entire project structures with context awareness
- **Automate Tedious Tasks**: Resolve lint issues, merge conflicts, generate release notes

### Installation Methods

```bash
# macOS/Linux
curl -fsSL https://claude.ai/install.sh | bash

# Homebrew
brew install --cask claude-code

# Windows PowerShell
irm https://claude.ai/install.ps1 | iex

# NPM (Requires Node.js 18+)
npm install -g @anthropic-ai/claude-code
```

### Why Developers Choose Claude Code

1. **Terminal-First Design**: Works in existing workflows without context switching
2. **Takes Action**: Directly edits files, runs commands, creates commits
3. **Unix Philosophy**: Composable and scriptable for complex pipelines
   - Example: `tail -f app.log | claude -p "Slack me if you see anomalies"`
   - Example: `claude -p "Translate new text strings to French and raise a PR"`
4. **Enterprise-Ready**: Use Claude API or host on AWS/GCP with built-in security

### CLAUDE.md Files - Critical Configuration

CLAUDE.md is a special file that Claude automatically pulls into context when starting a conversation. This is the primary mechanism for customizing Claude's behavior.

**What to Include:**
- Bash commands specific to your project
- Code style guidelines
- Testing instructions
- Repository conventions
- Architecture notes
- Directory layout explanations

**Placement Options:**
- Project root (highest priority)
- Parent directories (inherited)
- Home folder (`~/.claude/CLAUDE.md` for global settings)

### Common Workflows

#### 1. Explore-Plan-Code-Commit Pattern
- Have Claude read relevant files first (without coding)
- Create a plan using extended thinking ("think," "think hard," "think harder," "ultrathink")
- Implement solutions
- Commit changes

#### 2. Test-Driven Development
- Write tests first
- Confirm they fail
- Commit tests
- Write implementation code iteratively until all tests pass

#### 3. Visual Iteration
- Provide screenshots or design mocks
- Have Claude implement code
- Take screenshots to compare
- Iterate until matching the target

#### 4. Safe YOLO Mode
- Use `--dangerously-skip-permissions` in containerized environments
- Let Claude work autonomously on safe tasks like linting

### Optimization Techniques

**Specificity Matters**: Clear, detailed instructions significantly improve first-attempt success rates

**Visual Context**:
- Paste screenshots (macOS: cmd+ctrl+shift+4)
- Drag-drop images
- Provide file paths
- Claude excels with visual references

**File & URL References**:
- Use tab-completion for files
- Paste URLs for Claude to fetch
- Add domains to `/permissions` allowlist to avoid repeated prompts

**Course Correction Tools**:
- Ask for plans before coding
- Press Escape to interrupt mid-task
- Double-tap Escape to revisit and edit previous prompts
- Request undo operations

**Context Management**:
- Use `/clear` between tasks to reset context window
- Maintain performance during long sessions

**Checklists for Complex Tasks**:
- Have Claude create markdown checklists
- Address items one-by-one for migrations, lint fixes, or multi-step projects

### Infrastructure & Automation

**Headless Mode**:
```bash
claude -p "Your prompt here"
```
- Use for CI/CD, pre-commit hooks, or build scripts
- Add `--output-format stream-json` for structured output

**Automation Use Cases**:
- Issue triage: Automate GitHub issue labeling
- Code review: Provide subjective reviews beyond traditional linting
- Catch typos, stale comments, and misleading names

### Multi-Agent Strategies with Claude Code

**Parallel Verification**:
- One Claude writes code
- Another reviews it
- Use `/clear` to separate contexts
- Third Claude edits based on feedback

**Multiple Checkouts**:
- Create 3-4 git checkouts in separate terminal tabs
- Start Claude in each with different tasks
- Cycle through to approve permissions

**Git Worktrees** (Recommended):
```bash
git worktree add ../branch-name branch
# Work in parallel
git worktree remove ../branch-name
```
- Lighter-weight alternative to multiple checkouts
- Allows multiple independent tasks simultaneously

**Programmatic Integration**:
- Use headless mode with custom harnesses
- "Fanning out" for large migrations
- "Pipelining" for integration into processing workflows

### Advanced Git & GitHub Integration

**Git History Analysis**: Explicitly prompt Claude to search git history for:
- Questions about changes
- Feature ownership
- API design decisions

**Commit Messages**: Claude automatically examines diffs and recent history to compose contextual commit messages

**Complex Operations**:
- Reverting files
- Resolving rebase conflicts
- Comparing/grafting patches

**GitHub Automation**:
- Create PRs using "pr" shorthand
- Fix code review comments
- Resolve failing builds
- Categorize and triage open issues

---

## Claude API Best Practices

### Tool Use Overview

Claude can interact with two types of tools:

#### 1. Client Tools
- **User-defined custom tools**: You create and implement
- **Anthropic-defined tools**: Like computer use and text editor (require client implementation)

#### 2. Server Tools
- **Anthropic-hosted**: Execute on Anthropic's servers
- Examples: web_search, web_fetch
- Must be specified in API request but don't require implementation
- Use versioned types (e.g., `web_search_20250305`, `text_editor_20250124`)

### Client Tool Integration Workflow

1. **Provide Claude with tools and user prompt**
   - Define tools with names, descriptions, and input schemas
   - Include user prompt that might require these tools

2. **Claude decides to use a tool**
   - Assesses if tools can help with query
   - Constructs properly formatted tool use request
   - API response has `stop_reason` of `tool_use`

3. **Execute the tool and return results**
   - Extract tool name and input from Claude's request
   - Execute tool code on your system
   - Return results in new `user` message with `tool_result` content block

4. **Claude uses tool result to formulate response**
   - Analyzes tool results
   - Crafts final response to original user prompt

### Server Tool Integration Workflow

1. **Provide Claude with tools and user prompt**
   - Server tools have their own parameters
   - Example: "Search for the latest news about AI"

2. **Claude executes the server tool**
   - Assesses if server tool can help
   - Executes tool automatically
   - Results incorporated into Claude's response

3. **Claude formulates response**
   - No additional user interaction needed for server tool execution

### Tool Use Examples

#### Basic Single Tool
```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=1024,
    tools=[
        {
            "name": "get_weather",
            "description": "Get the current weather in a given location",
            "input_schema": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and state, e.g. San Francisco, CA"
                    },
                    "unit": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"],
                        "description": "The unit of temperature"
                    }
                },
                "required": ["location"]
            }
        }
    ],
    messages=[{"role": "user", "content": "What is the weather like in San Francisco?"}]
)
```

#### Parallel Tool Use

Claude can call multiple tools in parallel within a single response. All `tool_use` blocks are included in a single assistant message, and all corresponding `tool_result` blocks must be provided in the subsequent user message.

**Critical**: Tool results must be formatted correctly to avoid API errors and ensure Claude continues using parallel tools.

#### Sequential Tools

Some tasks require calling multiple tools in sequence, using output of one as input to another. Claude will call one tool at a time if prompted properly.

### Missing Information Handling

- **Claude Opus**: More likely to recognize missing parameters and ask for them
- **Claude Sonnet**: May ask or infer reasonable values
- **Claude Haiku**: More likely to guess parameters

### Chain of Thought Tool Use Prompt

For Claude Sonnet and Haiku to better assess queries before making tool calls:

```
Answer the user's request using relevant tools (if they are available). Before calling a tool, do some analysis. First, think about which of the provided tools is the relevant tool to answer the user's request. Second, go through each of the required parameters of the relevant tool and determine if the user has directly provided or given enough information to infer a value. When deciding if the parameter can be inferred, carefully consider all the context to see if it supports a specific value. If all of the required parameters are present or can be reasonably inferred, proceed with the tool call. BUT, if one of the values for a required parameter is missing, DO NOT invoke the function (not even with fillers for the missing params) and instead, ask the user to provide the missing parameters. DO NOT ask for more information on optional parameters if it is not provided.
```

### JSON Mode (Forced Tool Use)

Use tools to get Claude to produce JSON output following a schema without running the tool:

- Provide a **single** tool
- Set `tool_choice` to force use of that tool
- Tool name and description should be from model's perspective
- Model passes `input` to tool

Example:
```python
response = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=1024,
    tools=[{
        "name": "record_summary",
        "description": "Record summary of an image using well-structured JSON.",
        "input_schema": {
            "type": "object",
            "properties": {
                "key_colors": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "r": {"type": "number"},
                            "g": {"type": "number"},
                            "b": {"type": "number"},
                            "name": {"type": "string"}
                        }
                    }
                },
                "description": {"type": "string"}
            }
        }
    }],
    tool_choice={"type": "tool", "name": "record_summary"}
)
```

### Tool Use Pricing

Tool use requests are priced based on:
1. Total input tokens (including in `tools` parameter)
2. Number of output tokens generated
3. For server-side tools: additional usage-based pricing

**Token Overhead:**
- `tools` parameter (names, descriptions, schemas)
- `tool_use` content blocks in requests/responses
- `tool_result` content blocks in requests
- Special system prompt (varies by model)

**System Prompt Token Counts:**

| Model | `auto`/`none` | `any`/`tool` |
|-------|---------------|--------------|
| Claude Opus 4.5 | 346 tokens | 313 tokens |
| Claude Opus 4.1 | 346 tokens | 313 tokens |
| Claude Opus 4 | 346 tokens | 313 tokens |
| Claude Sonnet 4.5 | 346 tokens | 313 tokens |
| Claude Sonnet 4 | 346 tokens | 313 tokens |
| Claude Haiku 4.5 | 346 tokens | 313 tokens |
| Claude Haiku 3.5 | 264 tokens | 340 tokens |

---

## Tool Use Patterns

### Structured Outputs (Public Beta)

Announced November 14, 2025 for Claude Sonnet 4.5 and Opus 4.1. Guarantees API responses conform exactly to your JSON schema.

#### Two Modes:

1. **JSON Outputs** (`response_format`): Validated JSON responses matching specific schema
2. **Strict Tool Use** (`strict: true`): Guaranteed schema validation for tool inputs

#### How to Enable:

Add header: `anthropic-beta: structured-outputs-2025-11-13`

**For strict tool use:**
```python
tools=[{
    "name": "book_flight",
    "description": "Book a flight",
    "input_schema": {
        "type": "object",
        "properties": {
            "passengers": {"type": "integer"}
        }
    },
    "strict": true  # Guarantees type enforcement
}]
```

**For JSON outputs:**
```python
response = client.messages.create(
    model="claude-sonnet-4-5",
    output_format={
        "type": "json_schema",
        "json_schema": {
            "name": "response_schema",
            "schema": your_json_schema
        }
    }
)
```

#### SDK Support:

Define schema once in:
- **Python**: Pydantic
- **TypeScript**: Zod

Claude handles the rest with automatic validation and transformation.

#### Key Benefits:

Example: Booking system needs `passengers: int`
- **Without strict mode**: May get `passengers: "two"` or `passengers: "2"`
- **With strict mode**: Guaranteed `passengers: 2`

#### Limitations:

- Citations conflict with strict JSON schema (returns 400 error if both enabled)
- Guarantees format, not accuracy (hallucinations still possible)

### MCP (Model Context Protocol) Integration

MCP allows using tools from MCP servers directly with Claude's Messages API.

#### Converting MCP Tools:

```python
from mcp import ClientSession

async def get_claude_tools(mcp_session: ClientSession):
    """Convert MCP tools to Claude's tool format."""
    mcp_tools = await mcp_session.list_tools()

    claude_tools = []
    for tool in mcp_tools.tools:
        claude_tools.append({
            "name": tool.name,
            "description": tool.description or "",
            "input_schema": tool.inputSchema  # Rename inputSchema to input_schema
        })

    return claude_tools
```

Then pass to Claude:
```python
claude_tools = await get_claude_tools(mcp_session)

response = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=1024,
    tools=claude_tools,
    messages=[{"role": "user", "content": "What tools do you have available?"}]
)
```

When Claude responds with `tool_use` block, execute tool on MCP server using `call_tool()` and return result in `tool_result` block.

### Programmatic Tool Calling

Advanced pattern enabling Claude to orchestrate tools through code rather than individual API round-trips.

**Key Advantages:**
- Claude writes code that calls multiple tools
- Processes outputs in code
- Controls what information enters context window
- Loops, conditionals, data transformations explicit in code
- More reliable, precise control flow

**Use Cases:**
- Complex multi-step workflows
- Data transformations between tool calls
- Conditional tool execution
- Error handling logic

---

## Multi-Agent Architecture

### Anthropic's Multi-Agent Research System

Built on **orchestrator-worker pattern**:
- **Lead Agent**: Central orchestrator directing process
- **Subagents**: Supporting units handling specific tasks

### Architecture Pattern

When user submits query:
1. Lead agent analyzes query
2. Develops strategy
3. Spawns subagents to explore different aspects simultaneously
4. Subagents work in parallel
5. Lead agent synthesizes results

### Subagent Coordination

**Synchronous Execution**: Lead agent waits for subagent completion before proceeding.

Each subagent receives:
- **Clear objectives**: What to accomplish
- **Specified output formats**: How to structure results
- **Tool/source guidance**: Which resources to use
- **Defined task boundaries**: Scope limitations

**Critical**: Without detailed instructions, agents duplicate work or leave gaps.

### Scaling Rules

Embedded in prompts to prevent over-investment in simple problems:

- **Simple fact-finding**: 1 agent, 3-10 tool calls
- **Direct comparisons**: 2-4 subagents, 10-15 calls each
- **Complex research**: 10+ subagents with divided responsibilities

### Performance Metrics

**Key Findings from Anthropic's Internal Evaluations:**

- Multi-agent systems (Claude Opus 4 lead + Claude Sonnet 4 subagents): **90.2% improvement** over single-agent Opus 4
- Token usage alone explains **80% of performance variance**
- Parallel tool calling reduced research time by **up to 90%**
- Multi-agent systems use approximately **15× more tokens** than chat interactions
- Agents use **4× more tokens** than chat interactions

### Trade-offs

**When to Use Multi-Agent Systems:**
- Heavily parallelizable work
- Tasks exceeding single context windows
- Breadth-first research
- Value justifies increased token consumption

**When NOT to Use:**
- Domains requiring shared context
- Real-time coordination needed
- Coding tasks (better with single agent)
- Simple queries

### Emergent Behaviors

Multi-agent systems have emergent behaviors arising without specific programming:
- Small changes to lead agent can unpredictably change subagent behavior
- Success requires understanding interaction patterns, not just individual agents
- Best prompts are frameworks for collaboration defining:
  - Division of labor
  - Problem-solving approaches
  - Effort budgets

### Five Core Workflow Patterns

Anthropic's framework for building agentic systems:

1. **Prompt Chaining**: Sequential prompts where output feeds next input
2. **Routing**: Directing queries to specialized agents
3. **Parallelization**: Running multiple independent tasks simultaneously
4. **Orchestrator-Workers**: Central coordinator with specialized workers
5. **Evaluator-Optimizer**: Iterative refinement through evaluation loops

### Long-Running Agent Challenges

**Core Challenge**: Agents must work in discrete sessions; each new session begins with no memory.

**Anthropic's Solution (Two-Fold):**
1. **Initializer Agent**: Sets up environment on first run
2. **Coding Agent**: Makes incremental progress in every session, leaves clear artifacts for next session

**Key Capabilities:**
- Context management with compaction
- Enables work without exhausting context window
- Maintains progress across sessions

---

## Agent Skills Framework

### Core Concept

Agent Skills are organized directories containing instructions, scripts, and resources that enable Claude to perform specialized tasks. "Skills extend Claude's capabilities by packaging your expertise into composable resources for Claude."

### Structural Anatomy

**Every Skill Requires SKILL.md:**

YAML frontmatter with:
- `name`: Skill identifier
- `description`: Purpose and use cases

### Progressive Disclosure Pattern

**Three-Level Information Organization:**

**Level One (Metadata):**
- Skill name and description pre-loaded into system prompt at startup
- Enables Claude to recognize when skills are relevant
- No full content loaded

**Level Two (Core Content):**
- Complete SKILL.md file loaded when Claude determines relevance
- Loaded only when needed for current task

**Level Three+ (Supplementary):**
- Additional files (reference.md, forms.md) bundled within skill directory
- Discoverable only as needed
- Claude can use Bash tools to read files selectively

**Key Principle**: "Agents with a filesystem and code execution tools don't need to read the entirety of a skill into their context window."

### Implementation Details

**Context Window Management:**
- Skills triggered through system prompt references
- When activated, Claude can:
  - Invoke Bash tools to read SKILL.md
  - Selectively load bundled files
  - Execute pre-written scripts
  - Without loading full content into context

**Code Execution Integration:**
- Skills support embedded executable code (typically Python)
- Claude can run deterministically
- Prioritizes efficiency and reliability over token generation

### Development Best Practices

1. **Start with evaluation**: Identify capability gaps through representative task testing
2. **Structure for scale**:
   - Separate unwieldy files
   - Flag mutually exclusive contexts to reduce token usage
3. **Adopt Claude's perspective**:
   - Monitor real-world usage patterns
   - Refine skill names/descriptions accordingly
4. **Iterate collaboratively**:
   - Request Claude's self-reflection on failures
   - Discover genuine context needs

### Security Considerations

- Install skills only from trusted sources
- For untrusted skills:
  - Audit bundled files for suspicious code
  - Check dependencies
  - Review external network connections before deployment

### Current Availability

Agent Skills supported across:
- Claude.ai
- Claude Code
- Claude Agent SDK
- Claude Developer Platform

---

## Model Context Protocol (MCP)

### Overview

Open standard, open-source framework introduced by Anthropic (November 2024) to standardize how AI systems integrate and share data with external tools, systems, and data sources.

**Architecture**: Two-way connections between:
- **MCP Servers**: Expose data through protocol
- **MCP Clients**: AI applications connecting to servers

### Major 2025 Developments

#### Industry Adoption

- **March 2025**: OpenAI officially adopted MCP
  - Integrated across ChatGPT desktop app
  - OpenAI's Agents SDK
  - Responses API
- **April 2025**: Google DeepMind (Demis Hassabis) confirmed MCP support in upcoming Gemini models
- Integration with Microsoft Semantic Kernel and Azure OpenAI

#### Linux Foundation Donation

**December 2025**: Anthropic donated MCP to Agentic AI Foundation (AAIF)
- Directed fund under Linux Foundation
- Co-founded by Anthropic, Block, and OpenAI
- Support from Google, Microsoft, AWS, Cloudflare, Bloomberg

#### Scale and Growth

- **10,000+ active public MCP servers**
- Coverage: developer tools to Fortune 500 deployments
- **97M+ monthly SDK downloads** (Python and TypeScript)
- Claude directory: **75+ connectors** powered by MCP

### Pre-Built MCP Servers

Anthropic maintains open-source repository of reference implementations for:
- Google Drive
- Slack
- GitHub
- Git
- Postgres
- Puppeteer
- Stripe

### Technical Features

**SDKs Available:**
- Python
- TypeScript
- C#
- Java

**Protocol Details:**
- Re-uses message-flow ideas from Language Server Protocol (LSP)
- Transported over JSON-RPC 2.0
- Standard transport mechanisms:
  - stdio
  - HTTP (optionally with SSE)

### Security Considerations (April 2025 Analysis)

Multiple outstanding security issues identified:
- Prompt injection vulnerabilities
- Tool permissions: combining tools can exfiltrate files
- Lookalike tools can silently replace trusted ones

**Recommendation**: Use MCP from trusted sources only.

### Code Execution Pattern with MCP

Enables agents to:
- Load tools on demand
- Filter data before it reaches model
- Execute complex logic in a single step

**Performance Impact Example:**
- **Before**: ~150,000 tokens (tools and intermediate data passed through model)
- **After**: ~2,000 tokens (code execution and filesystem-based MCP APIs)
- **Result**: 98.7% reduction in token usage

---

## Context Management Strategies

### Prompt Caching

Announced by Anthropic, now available on the Claude API. Enables storing and reusing context between API calls.

#### Key Benefits

- **Cost Reduction**: Up to 90% reduction in input token costs
- **Latency Reduction**: Up to 85% reduction in response times for long prompts
- **Example**: 100K-token book
  - Without caching: 11.5s response time
  - With caching: 2.4s response time

#### Supported Models

- Claude Opus 4.5, 4.1, 4
- Claude Sonnet 4.5, 4, 3.7
- Claude Haiku 4.5, 3.5, 3
- Claude Opus 3 (deprecated)

#### How It Works

**Cache Lifetime:**
- Default TTL: 5 minutes
- Extended option: 1-hour cache TTL
- Lifetime refreshed each time cached content is used

**Cache Breakpoints:**
- Define up to 4 cache breakpoints using `cache_control` parameters
- Specify `"cache_control": {"type": "ephemeral"}` in content object

**Automatic Optimization (Recent Update):**
- Claude automatically reads from longest previously cached prefix
- No need to manually track cached segments
- System automatically identifies most relevant cached content

#### Use Cases

**Detailed Instruction Sets:**
- Share extensive lists of instructions, procedures, examples
- Include dozens of diverse high-quality output examples

**Agentic Search and Tool Use:**
- Multiple rounds of tool calls
- Iterative changes
- Each step typically requires new API call

**Document Analysis:**
- Talk to books, papers, documentation, podcast transcripts
- Embed entire documents into prompt
- Let users ask questions

#### Recent Improvements

**Token Limit Changes:**
- Prompt cache read tokens no longer count against Input Tokens Per Minute (ITPM) limit
- Applies to Claude 3.7 Sonnet on Anthropic API
- Optimize caching usage to increase throughput
- Get more out of existing ITPM rate limits

#### Privacy & Security

**Cache Keys:**
- Generated using cryptographic hash of prompts up to cache control point
- Only identical prompts can access specific cache

**Organization Isolation:**
- Caches are organization-specific
- Users within same organization can access same cache (identical prompts)
- Caches NOT shared across different organizations (even for identical prompts)

### Claude Agent SDK Context Management

**Agentic Search Pattern:**
- Use bash tools (grep, tail) to intelligently load files
- Don't dump entire documents
- Load only what's needed

**File System Organization:**
- Structure directories as form of context engineering
- Organize for discoverability

**Semantic Search:**
- Deploy as optimization when speed becomes critical
- Not default first approach

**Compaction:**
- Automatically summarize conversation history
- Maintain context windows across long sessions
- Store just the plan, key decisions, latest artifacts
- Compress global state aggressively

**Context Reset:**
- Use `/clear` command in Claude Code between tasks
- Reset context window
- Maintain performance during long sessions

---

## Implementation Recommendations

### Starting a New Project with Claude Code

1. **Create CLAUDE.md file** in project root
   - Document bash commands
   - Specify code style guidelines
   - Include testing instructions
   - Explain repository conventions

2. **Set up tool permissions**
   - Use `/permissions` command
   - Or manually edit `.claude/settings.json`
   - Consider `--allowedTools` CLI flag for automation

3. **Install GitHub CLI** (`gh`)
   - Enables Claude to manage issues, PRs, comments

4. **Configure MCP servers** (if needed)
   - Via project config
   - Via global config
   - Via checked-in `.mcp.json` files
   - Use `--mcp-debug` flag for troubleshooting

### Building Multi-Agent Systems

**Follow Anthropic's Patterns:**

1. **Choose appropriate pattern**:
   - Orchestrator-workers for parallel decomposable tasks
   - Prompt chaining for sequential dependencies
   - Routing for specialized expertise
   - Evaluator-optimizer for iterative refinement

2. **Define clear boundaries**:
   - Explicit objectives for each agent
   - Specified output formats
   - Tool/source guidance
   - Task scope limitations

3. **Implement scaling rules**:
   - Prevent over-investment in simple queries
   - Define effort budgets in prompts
   - Match complexity to task requirements

4. **Monitor emergent behaviors**:
   - Test interaction patterns
   - Small prompt changes can have large effects
   - Focus on collaboration frameworks, not just instructions

### Implementing Tool Use

**Best Practices:**

1. **Clear tool descriptions**:
   - Be specific about tool purpose
   - Include detailed parameter descriptions
   - Specify required vs optional parameters

2. **Use chain of thought prompting** for Sonnet/Haiku:
   - Ask Claude to analyze before calling tools
   - Verify all required parameters present
   - Confirm parameter values can be inferred

3. **Implement strict tool use** for production:
   - Use `strict: true` for type safety
   - Define schemas with Pydantic/Zod
   - Eliminate parsing errors and validation issues

4. **Consider parallel tool calls**:
   - For independent operations
   - Format tool results correctly
   - All results in single user message

5. **Leverage prompt caching**:
   - For repeated tool definitions
   - For long instruction sets
   - Set cache breakpoints strategically

### Context Optimization

**Priority-Based Approach:**

1. **Start with agentic search**:
   - Use bash tools for intelligent file loading
   - Structure directories for discoverability
   - Load files selectively

2. **Add prompt caching**:
   - For frequently used context (instructions, examples)
   - For large documents (books, papers, documentation)
   - Monitor cache hit rates

3. **Implement compaction** for long sessions:
   - Summarize conversation history
   - Store key decisions and artifacts
   - Reset context with `/clear` when appropriate

4. **Deploy semantic search** as optimization:
   - When speed becomes critical
   - For very large codebases
   - Not as default first approach

### Agent Skills Development

**Development Workflow:**

1. **Start with evaluation**:
   - Identify capability gaps through testing
   - Use representative tasks
   - Document failure modes

2. **Create minimal SKILL.md**:
   - Clear name and description
   - Core instructions
   - Essential resources only

3. **Implement progressive disclosure**:
   - Level 1: Metadata in system prompt
   - Level 2: Core SKILL.md content
   - Level 3+: Supplementary files as needed

4. **Test and iterate**:
   - Monitor real-world usage
   - Request Claude's self-reflection on failures
   - Refine based on actual needs

5. **Optimize for scale**:
   - Separate large files
   - Flag mutually exclusive contexts
   - Reduce token usage where possible

### MCP Integration

**When to Use MCP:**

- Standardized integration with external services
- Authentication already handled
- Need for community-maintained connectors
- Building reusable integrations

**Setup Process:**

1. Choose MCP servers from Anthropic's directory or community
2. Configure via `.mcp.json` (project or global)
3. Convert MCP tool schemas to Claude format (rename `inputSchema` to `input_schema`)
4. Implement tool execution handlers
5. Return results in proper `tool_result` format

**Security Checklist:**

- Audit skill/server code before installation
- Verify dependencies
- Check for external network connections
- Use only trusted sources

### Production Deployment

**Checklist:**

1. **Error Handling**:
   - Implement retry logic for API calls
   - Handle `pause_turn` stop reason for long-running operations
   - Validate tool results before returning to Claude

2. **Monitoring**:
   - Track token usage (especially for multi-agent)
   - Monitor cache hit rates
   - Log tool execution patterns

3. **Cost Optimization**:
   - Use prompt caching for repeated context
   - Implement compaction for long sessions
   - Choose appropriate model tier (Opus/Sonnet/Haiku)
   - Consider code execution with MCP for token reduction

4. **Quality Assurance**:
   - Build representative test sets
   - Programmatic evaluation
   - Test failure modes
   - Validate agent coordination

5. **Security**:
   - Audit MCP servers and Agent Skills
   - Implement proper permissions
   - Use sandboxing where appropriate
   - Monitor for prompt injection vulnerabilities

---

## Key Takeaways

### Claude Code
- Terminal-first agentic coding tool
- CLAUDE.md is critical for customization
- Unix philosophy: composable and scriptable
- Use `/clear` for context management
- Headless mode for automation

### Tool Use
- Two types: client tools and server tools
- Strict mode guarantees schema conformance
- Parallel tool calls for independent operations
- Chain of thought prompting improves tool selection
- Prompt caching dramatically reduces costs

### Multi-Agent Systems
- Orchestrator-worker pattern most common
- 90.2% improvement over single-agent for research tasks
- 15× token usage vs chat interactions
- Scaling rules prevent over-investment
- Best for parallelizable, breadth-first work

### Agent Skills
- Progressive disclosure keeps context lean
- Three-level information organization
- Code execution for deterministic operations
- Start with evaluation to identify gaps
- Security audit required for untrusted skills

### MCP
- Open standard for AI integration
- 10,000+ servers, 97M+ monthly downloads
- 98.7% token reduction possible with code execution
- Donated to Linux Foundation (December 2025)
- Security considerations require attention

### Context Management
- Prompt caching: 90% cost reduction, 85% latency reduction
- Agentic search before semantic search
- Compaction for long sessions
- Organization-isolated caches
- Cache read tokens don't count against ITPM

---

## Sources

### Official Anthropic Documentation
- [Claude Code Overview](https://code.claude.com/docs/en/overview)
- [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- [Tool Use with Claude](https://platform.claude.com/docs/en/build-with-claude/tool-use)
- [Structured Outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- [Prompt Caching](https://docs.claude.com/en/docs/build-with-claude/prompt-caching)

### Multi-Agent Architecture
- [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
- [Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)
- [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)

### Model Context Protocol
- [Introducing the Model Context Protocol](https://www.anthropic.com/news/model-context-protocol)
- [Code Execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp)
- [MCP Specification](https://modelcontextprotocol.io/specification/2025-03-26)

### Additional Resources
- [GitHub: claude-code](https://github.com/anthropics/claude-code)
- [Anthropic: Introducing Agent Skills](https://www.anthropic.com/news/skills)
- [Anthropic: Token-saving updates](https://www.anthropic.com/news/token-saving-updates)

---

**End of Report**

This research provides a comprehensive foundation for implementing Claude-based systems following Anthropic's official best practices and patterns. All recommendations are derived from official documentation and engineering blog posts published by Anthropic.
