#!/usr/bin/env node
/**
 * Sartor Network Bootstrap - JavaScript/Node.js Implementation
 *
 * USAGE FOR A FRESH AGENT:
 *     node sartor-network-bootstrap.js
 *
 * REQUIREMENTS:
 *     - Node.js 14+ (uses native fetch in Node 18+, or node-fetch for older versions)
 *
 * WHAT IT DOES:
 *     1. Connects you to the Firebase-based MCP network
 *     2. Provides all MCP tool functions
 *     3. Enables sub-agent auto-onboarding
 *     4. Modern ES6+ JavaScript
 *     5. Works in Node.js and modern browsers
 */

// Node.js compatibility - use native fetch if available, otherwise require node-fetch
let fetch;
if (typeof globalThis.fetch === 'undefined') {
    try {
        fetch = require('node-fetch');
    } catch (e) {
        console.error('❌ fetch not available. Install node-fetch: npm install node-fetch');
        process.exit(1);
    }
} else {
    fetch = globalThis.fetch;
}

// UUID generation
function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback UUID generation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Sartor Network Client Class
 */
class SartorNetworkClient {
    /**
     * Initialize network client
     * @param {Object} options - Configuration options
     * @param {string} options.firebaseUrl - Firebase Realtime Database URL
     * @param {string} options.agentId - Your agent ID (auto-generated if not provided)
     * @param {string} options.agentName - Friendly name for your agent
     * @param {string} options.parentAgentId - Parent agent ID (for sub-agents)
     */
    constructor(options = {}) {
        this.firebaseUrl = (options.firebaseUrl ||
                          process.env.SARTOR_FIREBASE_URL ||
                          'https://home-claude-network-default-rtdb.firebaseio.com')
                          .replace(/\/$/, '');

        this.agentId = options.agentId ||
                       process.env.SARTOR_AGENT_ID ||
                       this._generateAgentId();

        this.agentName = options.agentName ||
                        process.env.SARTOR_AGENT_NAME ||
                        `Agent-${this.agentId.substring(0, 12)}`;

        this.parentAgentId = options.parentAgentId ||
                            process.env.SARTOR_PARENT_AGENT_ID ||
                            null;

        this.isConnected = false;

        console.log('🤖 Sartor Network Client initialized');
        console.log(`   Agent ID: ${this.agentId}`);
        console.log(`   Agent Name: ${this.agentName}`);
    }

    /**
     * Generate unique agent ID
     * @private
     */
    _generateAgentId() {
        const timestamp = Date.now();
        const randomId = generateUUID().substring(0, 8);
        return `claude-js-${timestamp}-${randomId}`;
    }

    /**
     * Get current timestamp in ISO format
     * @private
     */
    _getTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Make HTTP request to Firebase REST API
     * @private
     */
    async _firebaseRequest(method, path, data = null) {
        const url = `${this.firebaseUrl}/agents-network${path}.json`;

        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (data && (method === 'PUT' || method === 'POST' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            return result;

        } catch (error) {
            console.error(`⚠️  Firebase request failed: ${error.message}`);
            return null;
        }
    }

    // ========================================================================
    // Connection Methods
    // ========================================================================

    /**
     * Connect to the Sartor Claude Network
     * @returns {Promise<boolean>} True if connection successful
     */
    async connect() {
        console.log('\n🌐 Connecting to Sartor Claude Network...');

        const agentData = {
            agent_id: this.agentId,
            agent_name: this.agentName,
            status: 'online',
            capabilities: ['communication', 'tasks', 'skills', 'knowledge'],
            joined_at: this._getTimestamp(),
            last_seen: this._getTimestamp(),
        };

        if (this.parentAgentId) {
            agentData.parent_agent_id = this.parentAgentId;
        }

        const result = await this._firebaseRequest('PUT', `/agents/${this.agentId}`, agentData);

        if (result) {
            // Set presence
            const presenceData = {
                online: true,
                last_seen: this._getTimestamp()
            };
            await this._firebaseRequest('PUT', `/presence/${this.agentId}`, presenceData);

            this.isConnected = true;
            console.log('✅ Connected to Sartor Claude Network!');
            console.log(`   Firebase: ${this.firebaseUrl}`);
            console.log('   Status: Online');

            // Show network status
            const agents = await this.agentList();
            console.log(`   Network: ${agents.length} agents online`);

            return true;
        } else {
            console.log('❌ Connection failed');
            return false;
        }
    }

    /**
     * Disconnect from network
     */
    async disconnect() {
        if (!this.isConnected) {
            return;
        }

        await this._firebaseRequest('PATCH', `/agents/${this.agentId}`, {
            status: 'offline',
            last_seen: this._getTimestamp()
        });

        await this._firebaseRequest('PATCH', `/presence/${this.agentId}`, {
            online: false,
            last_seen: this._getTimestamp()
        });

        this.isConnected = false;
        console.log('👋 Disconnected from network');
    }

    // ========================================================================
    // Communication Methods
    // ========================================================================

    /**
     * Send direct message to another agent
     * @param {string} toAgentId - Recipient agent ID
     * @param {string} content - Message content
     * @returns {Promise<boolean>} True if message sent successfully
     */
    async messageSend(toAgentId, content) {
        const messageId = generateUUID();
        const messageData = {
            from: this.agentId,
            to: toAgentId,
            content: content,
            timestamp: this._getTimestamp(),
            read: false,
        };

        const result = await this._firebaseRequest(
            'PUT',
            `/messages/direct/${toAgentId}/${messageId}`,
            messageData
        );

        if (result) {
            console.log(`📤 Message sent to ${toAgentId}`);
            return true;
        }
        return false;
    }

    /**
     * Broadcast message to all agents
     * @param {string} content - Message content
     * @returns {Promise<boolean>} True if broadcast sent successfully
     */
    async messageBroadcast(content) {
        const messageId = generateUUID();
        const messageData = {
            from: this.agentId,
            content: content,
            timestamp: this._getTimestamp(),
        };

        const result = await this._firebaseRequest(
            'PUT',
            `/messages/broadcast/${messageId}`,
            messageData
        );

        if (result) {
            console.log(`📢 Broadcast sent: ${content}`);
            return true;
        }
        return false;
    }

    /**
     * Read messages for this agent
     * @param {number} count - Number of messages to read (default: 10)
     * @returns {Promise<Array>} Array of messages
     */
    async messageRead(count = 10) {
        const messages = await this._firebaseRequest('GET', `/messages/direct/${this.agentId}`);

        if (!messages) {
            return [];
        }

        // Convert to array and sort by timestamp
        const messageList = Object.entries(messages).map(([messageId, messageData]) => ({
            message_id: messageId,
            ...messageData
        }));

        messageList.sort((a, b) =>
            new Date(b.timestamp) - new Date(a.timestamp)
        );

        return messageList.slice(0, count);
    }

    // ========================================================================
    // Task Coordination Methods
    // ========================================================================

    /**
     * List tasks with given status
     * @param {string} status - Task status to filter by (default: 'available')
     * @returns {Promise<Array>} Array of tasks
     */
    async taskList(status = 'available') {
        const tasks = await this._firebaseRequest('GET', '/tasks');

        if (!tasks) {
            return [];
        }

        // Filter by status
        const taskList = Object.entries(tasks)
            .map(([taskId, taskData]) => ({
                task_id: taskId,
                ...taskData
            }))
            .filter(task => task.status === status);

        return taskList;
    }

    /**
     * Claim an available task
     * @param {string} taskId - Task ID to claim
     * @returns {Promise<boolean>} True if task claimed successfully
     */
    async taskClaim(taskId) {
        // Check if task is available
        const task = await this._firebaseRequest('GET', `/tasks/${taskId}`);

        if (!task || task.status !== 'available') {
            console.log(`❌ Task ${taskId} not available`);
            return false;
        }

        // Claim the task
        const claimData = {
            status: 'claimed',
            claimed_by: this.agentId,
            claimed_at: this._getTimestamp(),
        };

        const result = await this._firebaseRequest('PATCH', `/tasks/${taskId}`, claimData);

        if (result) {
            console.log(`✅ Claimed task: ${task.title || taskId}`);
            return true;
        }
        return false;
    }

    /**
     * Create a new task
     * @param {string} title - Task title
     * @param {string} description - Task description
     * @param {Object} taskData - Additional task data
     * @returns {Promise<string>} Task ID if created successfully
     */
    async taskCreate(title, description, taskData = {}) {
        const taskId = generateUUID();
        const task = {
            task_id: taskId,
            title: title,
            description: description,
            status: 'available',
            created_by: this.agentId,
            created_at: this._getTimestamp(),
            data: taskData,
        };

        const result = await this._firebaseRequest('PUT', `/tasks/${taskId}`, task);

        if (result) {
            console.log(`📝 Created task: ${title}`);
            return taskId;
        }
        return '';
    }

    /**
     * Update task status
     * @param {string} taskId - Task ID
     * @param {string} status - New status
     * @param {Object} result - Task result data
     */
    async taskUpdate(taskId, status, result = {}) {
        const updateData = {
            status: status,
            updated_by: this.agentId,
            updated_at: this._getTimestamp(),
            result: result,
        };

        await this._firebaseRequest('PATCH', `/tasks/${taskId}`, updateData);
        console.log(`📊 Updated task to ${status}`);
    }

    // ========================================================================
    // Knowledge Base Methods
    // ========================================================================

    /**
     * Add knowledge to collective knowledge base
     * @param {string} content - Knowledge content
     * @param {Array<string>} tags - Tags for categorization
     * @returns {Promise<string>} Knowledge ID if added successfully
     */
    async knowledgeAdd(content, tags = []) {
        const knowledgeId = generateUUID();
        const knowledgeData = {
            content: content,
            added_by: this.agentId,
            timestamp: this._getTimestamp(),
            tags: tags,
        };

        const result = await this._firebaseRequest('PUT', `/knowledge/${knowledgeId}`, knowledgeData);

        if (result) {
            console.log(`🧠 Added knowledge: ${content.substring(0, 50)}...`);
            return knowledgeId;
        }
        return '';
    }

    /**
     * Query knowledge base
     * @param {string} query - Search query (optional)
     * @returns {Promise<Array>} Array of knowledge entries
     */
    async knowledgeQuery(query = '') {
        const knowledge = await this._firebaseRequest('GET', '/knowledge');

        if (!knowledge) {
            return [];
        }

        // Convert to array
        let knowledgeList = Object.entries(knowledge).map(([knowledgeId, knowledgeData]) => ({
            knowledge_id: knowledgeId,
            ...knowledgeData
        }));

        // Filter by query if provided
        if (query) {
            const lowerQuery = query.toLowerCase();
            knowledgeList = knowledgeList.filter(k =>
                k.content.toLowerCase().includes(lowerQuery)
            );
        }

        return knowledgeList;
    }

    // ========================================================================
    // Agent Discovery Methods
    // ========================================================================

    /**
     * List all agents
     * @returns {Promise<Array>} Array of agents
     */
    async agentList() {
        const agents = await this._firebaseRequest('GET', '/agents');

        if (!agents) {
            return [];
        }

        // Convert to array
        const agentList = Object.entries(agents).map(([agentId, agentData]) => ({
            agent_id: agentId,
            ...agentData
        }));

        return agentList;
    }

    /**
     * Get status of specific agent
     * @param {string} agentId - Agent ID
     * @returns {Promise<Object>} Agent data
     */
    async agentStatus(agentId) {
        return await this._firebaseRequest('GET', `/agents/${agentId}`);
    }

    // ========================================================================
    // Sub-Agent Support Methods
    // ========================================================================

    /**
     * Get environment variables for sub-agent
     * @returns {Object} Environment variables
     */
    getSubAgentContext() {
        return {
            SARTOR_FIREBASE_URL: this.firebaseUrl,
            SARTOR_PARENT_AGENT_ID: this.agentId,
            SARTOR_NETWORK_MODE: 'firebase',
        };
    }

    /**
     * Get prompt text for sub-agent automatic onboarding
     * @param {string} subAgentId - Sub-agent ID (optional)
     * @returns {string} Prompt text
     */
    getSubAgentPrompt(subAgentId = null) {
        if (!subAgentId) {
            subAgentId = `${this.agentId}-subagent-${Date.now()}`;
        }

        return `
╔═══════════════════════════════════════════════════════════╗
║        SARTOR NETWORK - AUTOMATIC SUB-AGENT ONBOARDING    ║
╚═══════════════════════════════════════════════════════════╝

You are a sub-agent in the Sartor Claude Network with full network access.

YOUR IDENTITY:
  • Agent ID: ${subAgentId}
  • Parent Agent: ${this.agentId}
  • Network: Firebase MCP
  • Status: ✅ AUTOMATICALLY CONNECTED

NETWORK ACCESS CODE (JavaScript):
\`\`\`javascript
// Quick inline client
const SartorNetworkClient = require('./sartor-network-bootstrap.js');

const client = new SartorNetworkClient({
    firebaseUrl: '${this.firebaseUrl}',
    agentId: '${subAgentId}',
    parentAgentId: '${this.agentId}'
});

await client.connect();
await client.messageBroadcast('Sub-agent ready!');
\`\`\`

AVAILABLE METHODS:
  • messageSend(to, content) - Send direct message
  • messageBroadcast(content) - Broadcast to all
  • taskList() / taskClaim(id) - Task coordination
  • knowledgeQuery(q) / knowledgeAdd(content) - Knowledge sharing
  • agentList() - See all agents

You have FULL network access. Use it to coordinate with other agents!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your assigned task follows below:

`;
    }
}

// ============================================================================
// Demo Function
// ============================================================================

async function demoUsage() {
    console.log('======================================================================');
    console.log('  SARTOR NETWORK CLIENT - DEMO USAGE (JavaScript Version)');
    console.log('======================================================================');

    // Step 1: Create client and connect
    console.log('\n📌 STEP 1: Connect to Network');
    console.log('----------------------------------------------------------------------');
    const client = new SartorNetworkClient({ agentName: 'Demo-Agent-JS' });
    await client.connect();
    await sleep(1000);

    // Step 2: Broadcast announcement
    console.log('\n📌 STEP 2: Announce Yourself');
    console.log('----------------------------------------------------------------------');
    await client.messageBroadcast('Hello network! I\'m a new JavaScript agent.');
    await sleep(1000);

    // Step 3: Share knowledge
    console.log('\n📌 STEP 3: Share Knowledge');
    console.log('----------------------------------------------------------------------');
    await client.knowledgeAdd(
        'This is a demo of the Sartor Network JavaScript bootstrap',
        ['demo', 'bootstrap', 'javascript']
    );
    await sleep(1000);

    // Step 4: Check network
    console.log('\n📌 STEP 4: Explore Network');
    console.log('----------------------------------------------------------------------');

    const agents = await client.agentList();
    console.log(`👥 Found ${agents.length} agents`);
    agents.slice(-3).forEach(agent => {
        console.log(`   • ${agent.agent_id.substring(0, 30)}: ${agent.status}`);
    });

    const knowledge = await client.knowledgeQuery();
    console.log(`\n🧠 Found ${knowledge.length} knowledge entries`);
    knowledge.slice(-2).forEach(k => {
        console.log(`   • ${k.content.substring(0, 60)}...`);
    });

    const tasks = await client.taskList();
    console.log(`\n📋 Found ${tasks.length} available tasks`);

    await sleep(1000);

    // Step 5: Sub-agent prep
    console.log('\n📌 STEP 5: Prepare for Sub-Agents');
    console.log('----------------------------------------------------------------------');
    console.log('When spawning sub-agents, use this prompt:');
    console.log('');
    const subPrompt = client.getSubAgentPrompt();
    console.log(subPrompt.substring(0, 300) + '...');

    await sleep(1000);

    // Step 6: Cleanup
    console.log('\n📌 STEP 6: Disconnect');
    console.log('----------------------------------------------------------------------');
    await client.disconnect();

    console.log('\n======================================================================');
    console.log('  ✅ DEMO COMPLETE - You\'re ready to use the network!');
    console.log('======================================================================');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Import: const SartorNetworkClient = require(\'./sartor-network-bootstrap.js\')');
    console.log('  2. Create: const client = new SartorNetworkClient()');
    console.log('  3. Connect: await client.connect()');
    console.log('  4. Use the methods!');
    console.log('');
}

// Helper function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function main() {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║            SARTOR CLAUDE NETWORK - JAVASCRIPT BOOTSTRAP        ║
║                                                                ║
║  Single-file agent onboarding for the Sartor Network          ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

WHAT IS THIS?
  This is ALL you need to connect a fresh agent to the
  Sartor Claude Network using JavaScript/Node.js.

USAGE OPTIONS:

  1. Run as standalone script:
     $ node sartor-network-bootstrap.js

  2. Import and use in code:
     const SartorNetworkClient = require('./sartor-network-bootstrap.js');
     const client = new SartorNetworkClient();
     await client.connect();

  3. Use as ES6 module:
     import SartorNetworkClient from './sartor-network-bootstrap.js';
     const client = new SartorNetworkClient();
     await client.connect();

WHAT YOU GET:
  • Full MCP tool access (messages, tasks, knowledge, agents)
  • Automatic sub-agent onboarding
  • Firebase-based serverless operation
  • Real-time synchronization
  • Works in Node.js and browsers

====================================================================

Running demo in 3 seconds...
`);

    await sleep(3000);
    await demoUsage();
}

// Export for use as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SartorNetworkClient;
    module.exports.SartorNetworkClient = SartorNetworkClient;
}

// Run main if executed directly
if (typeof require !== 'undefined' && require.main === module) {
    main().catch(error => {
        console.error('Error:', error);
        process.exit(1);
    });
}
