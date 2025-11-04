#!/usr/bin/env node
/**
 * Test Script for JavaScript Bootstrap
 *
 * Tests all functionality of sartor-network-bootstrap.js
 */

const path = require('path');

// Colors for output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

// Test tracking
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

// Test data storage
let createdTaskId = null;
let createdKnowledgeId = null;

function logTest(message) {
    console.log(`${colors.blue}[TEST]${colors.reset} ${message}`);
}

function logPass(message) {
    console.log(`${colors.green}[PASS]${colors.reset} ${message}`);
    testsPassed++;
}

function logFail(message) {
    console.log(`${colors.red}[FAIL]${colors.reset} ${message}`);
    testsFailed++;
}

function logInfo(message) {
    console.log(`${colors.yellow}[INFO]${colors.reset} ${message}`);
}

function runTest(testName) {
    testsRun++;
    logTest(testName);
}

// ============================================================================
// Test Functions
// ============================================================================

async function testModuleImport() {
    runTest('Testing module import');

    try {
        const bootstrapPath = path.join(__dirname, 'sartor-network-bootstrap.js');
        const SartorNetworkClient = require(bootstrapPath);

        if (typeof SartorNetworkClient === 'function') {
            logPass('Module imported successfully');
            return SartorNetworkClient;
        } else {
            logFail('Module export is not a function');
            return null;
        }
    } catch (error) {
        logFail(`Failed to import module: ${error.message}`);
        return null;
    }
}

async function testClientCreation(SartorNetworkClient) {
    runTest('Testing client creation');

    try {
        const client = new SartorNetworkClient({
            agentName: 'JS-Test-Agent'
        });

        if (client && client.agentId) {
            logPass('Client created successfully');
            logInfo(`  Agent ID: ${client.agentId}`);
            logInfo(`  Agent Name: ${client.agentName}`);
            return client;
        } else {
            logFail('Client creation failed');
            return null;
        }
    } catch (error) {
        logFail(`Client creation error: ${error.message}`);
        return null;
    }
}

async function testConnect(client) {
    runTest('Testing connection');

    try {
        const result = await client.connect();

        if (result && client.isConnected) {
            logPass('Connected successfully');
            logInfo(`  Firebase: ${client.firebaseUrl}`);
            return true;
        } else {
            logFail('Connection failed');
            return false;
        }
    } catch (error) {
        logFail(`Connection error: ${error.message}`);
        return false;
    }
}

async function testMessageBroadcast(client) {
    runTest('Testing broadcast message');

    try {
        const testMessage = `Test broadcast from JavaScript test script at ${new Date().toISOString()}`;
        const result = await client.messageBroadcast(testMessage);

        if (result) {
            logPass('Broadcast sent successfully');
            return true;
        } else {
            logFail('Broadcast failed');
            return false;
        }
    } catch (error) {
        logFail(`Broadcast error: ${error.message}`);
        return false;
    }
}

async function testMessageSend(client) {
    runTest('Testing direct message');

    try {
        // Send message to self
        const testMessage = 'Test direct message from JavaScript test script';
        const result = await client.messageSend(client.agentId, testMessage);

        if (result) {
            logPass('Direct message sent successfully');
            // Give Firebase time to process
            await sleep(2000);
            return true;
        } else {
            logFail('Direct message failed');
            return false;
        }
    } catch (error) {
        logFail(`Direct message error: ${error.message}`);
        return false;
    }
}

async function testMessageRead(client) {
    runTest('Testing message reading');

    try {
        const messages = await client.messageRead(5);

        if (Array.isArray(messages)) {
            logPass(`Read ${messages.length} messages`);

            if (messages.length > 0) {
                logInfo('Latest message:');
                logInfo(`  From: ${messages[0].from}`);
                logInfo(`  Content: ${messages[0].content.substring(0, 50)}...`);
            }
            return true;
        } else {
            logFail('Failed to read messages');
            return false;
        }
    } catch (error) {
        logFail(`Message read error: ${error.message}`);
        return false;
    }
}

async function testTaskCreate(client) {
    runTest('Testing task creation');

    try {
        const title = 'Test Task from JavaScript';
        const description = 'This is a test task created by the JavaScript test script';
        const taskData = { test: true, language: 'javascript' };

        createdTaskId = await client.taskCreate(title, description, taskData);

        if (createdTaskId) {
            logPass(`Task created successfully: ${createdTaskId}`);
            return true;
        } else {
            logFail('Task creation failed');
            return false;
        }
    } catch (error) {
        logFail(`Task creation error: ${error.message}`);
        return false;
    }
}

async function testTaskList(client) {
    runTest('Testing task listing');

    try {
        const tasks = await client.taskList('available');

        if (Array.isArray(tasks)) {
            logPass(`Found ${tasks.length} available tasks`);

            if (tasks.length > 0) {
                logInfo('Sample tasks:');
                tasks.slice(0, 3).forEach(task => {
                    logInfo(`  • ${task.title}`);
                });
            }
            return true;
        } else {
            logFail('Failed to list tasks');
            return false;
        }
    } catch (error) {
        logFail(`Task list error: ${error.message}`);
        return false;
    }
}

async function testTaskClaim(client) {
    runTest('Testing task claiming');

    if (!createdTaskId) {
        logInfo('No task ID available, skipping claim test');
        return true;
    }

    try {
        const result = await client.taskClaim(createdTaskId);

        if (result) {
            logPass('Task claimed successfully');
            return true;
        } else {
            logFail('Task claim failed');
            return false;
        }
    } catch (error) {
        logFail(`Task claim error: ${error.message}`);
        return false;
    }
}

async function testTaskUpdate(client) {
    runTest('Testing task update');

    if (!createdTaskId) {
        logInfo('No task ID available, skipping update test');
        return true;
    }

    try {
        await client.taskUpdate(createdTaskId, 'completed', {
            success: true,
            test: 'completed',
            language: 'javascript'
        });

        logPass('Task updated successfully');
        return true;
    } catch (error) {
        logFail(`Task update error: ${error.message}`);
        return false;
    }
}

async function testKnowledgeAdd(client) {
    runTest('Testing knowledge addition');

    try {
        const content = `Test knowledge from JavaScript test script: ${new Date().toISOString()}`;
        const tags = ['test', 'javascript', 'automated'];

        createdKnowledgeId = await client.knowledgeAdd(content, tags);

        if (createdKnowledgeId) {
            logPass(`Knowledge added successfully: ${createdKnowledgeId}`);
            return true;
        } else {
            logFail('Knowledge addition failed');
            return false;
        }
    } catch (error) {
        logFail(`Knowledge add error: ${error.message}`);
        return false;
    }
}

async function testKnowledgeQuery(client) {
    runTest('Testing knowledge query');

    try {
        const knowledge = await client.knowledgeQuery();

        if (Array.isArray(knowledge)) {
            logPass(`Found ${knowledge.length} knowledge entries`);

            if (knowledge.length > 0) {
                logInfo('Sample knowledge:');
                knowledge.slice(-3).forEach(k => {
                    logInfo(`  • ${k.content.substring(0, 60)}...`);
                });
            }
            return true;
        } else {
            logFail('Failed to query knowledge');
            return false;
        }
    } catch (error) {
        logFail(`Knowledge query error: ${error.message}`);
        return false;
    }
}

async function testKnowledgeSearch(client) {
    runTest('Testing knowledge search');

    try {
        const knowledge = await client.knowledgeQuery('test');

        if (Array.isArray(knowledge)) {
            logPass(`Found ${knowledge.length} knowledge entries matching 'test'`);
            return true;
        } else {
            logFail('Failed to search knowledge');
            return false;
        }
    } catch (error) {
        logFail(`Knowledge search error: ${error.message}`);
        return false;
    }
}

async function testAgentList(client) {
    runTest('Testing agent listing');

    try {
        const agents = await client.agentList();

        if (Array.isArray(agents)) {
            logPass(`Found ${agents.length} agents`);

            if (agents.length > 0) {
                logInfo('Sample agents:');
                agents.slice(-5).forEach(agent => {
                    logInfo(`  • ${agent.agent_id.substring(0, 40)}: ${agent.status}`);
                });
            }
            return true;
        } else {
            logFail('Failed to list agents');
            return false;
        }
    } catch (error) {
        logFail(`Agent list error: ${error.message}`);
        return false;
    }
}

async function testAgentStatus(client) {
    runTest('Testing agent status lookup');

    try {
        const status = await client.agentStatus(client.agentId);

        if (status) {
            logPass('Retrieved agent status');
            logInfo(`  Status: ${status.status}`);
            return true;
        } else {
            logFail('Failed to get agent status');
            return false;
        }
    } catch (error) {
        logFail(`Agent status error: ${error.message}`);
        return false;
    }
}

async function testSubAgentContext(client) {
    runTest('Testing sub-agent context generation');

    try {
        const context = client.getSubAgentContext();

        if (context && context.SARTOR_FIREBASE_URL) {
            logPass('Sub-agent context generated');
            logInfo('Context variables:');
            Object.entries(context).forEach(([key, value]) => {
                logInfo(`    ${key}=${value}`);
            });
            return true;
        } else {
            logFail('Failed to generate sub-agent context');
            return false;
        }
    } catch (error) {
        logFail(`Sub-agent context error: ${error.message}`);
        return false;
    }
}

async function testSubAgentPrompt(client) {
    runTest('Testing sub-agent prompt generation');

    try {
        const prompt = client.getSubAgentPrompt('test-sub-agent');

        if (prompt && prompt.includes('SARTOR NETWORK')) {
            logPass('Sub-agent prompt generated');
            logInfo(`  Prompt length: ${prompt.length} characters`);
            return true;
        } else {
            logFail('Failed to generate sub-agent prompt');
            return false;
        }
    } catch (error) {
        logFail(`Sub-agent prompt error: ${error.message}`);
        return false;
    }
}

async function testDisconnect(client) {
    runTest('Testing disconnection');

    try {
        await client.disconnect();

        if (!client.isConnected) {
            logPass('Disconnected successfully');
            return true;
        } else {
            logFail('Disconnection failed');
            return false;
        }
    } catch (error) {
        logFail(`Disconnection error: ${error.message}`);
        return false;
    }
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function main() {
    console.log('════════════════════════════════════════════════════════════════');
    console.log('  JAVASCRIPT BOOTSTRAP TEST SUITE');
    console.log('════════════════════════════════════════════════════════════════');
    console.log('');

    // Import module
    const SartorNetworkClient = await testModuleImport();
    if (!SartorNetworkClient) {
        console.log('\n❌ Cannot continue without module');
        process.exit(1);
    }

    // Create client
    const client = await testClientCreation(SartorNetworkClient);
    if (!client) {
        console.log('\n❌ Cannot continue without client');
        process.exit(1);
    }

    console.log('');
    console.log('────────────────────────────────────────────────────────────────');
    console.log('  CONNECTION TESTS');
    console.log('────────────────────────────────────────────────────────────────');
    const connected = await testConnect(client);
    if (!connected) {
        console.log('\n❌ Cannot continue without connection');
        process.exit(1);
    }

    console.log('');
    console.log('────────────────────────────────────────────────────────────────');
    console.log('  COMMUNICATION TESTS');
    console.log('────────────────────────────────────────────────────────────────');
    await testMessageBroadcast(client);
    await testMessageSend(client);
    await testMessageRead(client);

    console.log('');
    console.log('────────────────────────────────────────────────────────────────');
    console.log('  TASK TESTS');
    console.log('────────────────────────────────────────────────────────────────');
    await testTaskCreate(client);
    await testTaskList(client);
    await testTaskClaim(client);
    await testTaskUpdate(client);

    console.log('');
    console.log('────────────────────────────────────────────────────────────────');
    console.log('  KNOWLEDGE TESTS');
    console.log('────────────────────────────────────────────────────────────────');
    await testKnowledgeAdd(client);
    await testKnowledgeQuery(client);
    await testKnowledgeSearch(client);

    console.log('');
    console.log('────────────────────────────────────────────────────────────────');
    console.log('  AGENT DISCOVERY TESTS');
    console.log('────────────────────────────────────────────────────────────────');
    await testAgentList(client);
    await testAgentStatus(client);

    console.log('');
    console.log('────────────────────────────────────────────────────────────────');
    console.log('  SUB-AGENT SUPPORT TESTS');
    console.log('────────────────────────────────────────────────────────────────');
    await testSubAgentContext(client);
    await testSubAgentPrompt(client);

    console.log('');
    console.log('────────────────────────────────────────────────────────────────');
    console.log('  CLEANUP');
    console.log('────────────────────────────────────────────────────────────────');
    await testDisconnect(client);

    // Summary
    console.log('');
    console.log('════════════════════════════════════════════════════════════════');
    console.log('  TEST SUMMARY');
    console.log('════════════════════════════════════════════════════════════════');
    console.log(`  Total Tests: ${testsRun}`);
    console.log(`  Passed: ${testsPassed}`);
    console.log(`  Failed: ${testsFailed}`);

    if (testsFailed === 0) {
        console.log(`  Result: ${colors.green}ALL TESTS PASSED${colors.reset} ✅`);
        console.log('════════════════════════════════════════════════════════════════');
        process.exit(0);
    } else {
        console.log(`  Result: ${colors.red}SOME TESTS FAILED${colors.reset} ❌`);
        console.log('════════════════════════════════════════════════════════════════');
        process.exit(1);
    }
}

// Helper function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Run main
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
