#!/usr/bin/env node

const inquirer = require("inquirer");
const fs = require("fs");
const path = require("path");
const yaml = require("yaml");

// ============================================
// VALIDATION FUNCTIONS (Security Layer)
// ============================================

/**
 * Validates workflow name to prevent path traversal and injection attacks
 * @param {string} name - Workflow name to validate
 * @returns {string} - Validated name
 * @throws {Error} - If validation fails
 */
function validateWorkflowName(name) {
    if (!name || typeof name !== 'string') {
        throw new Error('❌ Workflow name is required and must be a string');
    }

    // Only allow alphanumeric, underscore, and hyphen
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
        throw new Error('❌ Workflow name can only contain letters, numbers, underscores, and hyphens');
    }

    if (name.length < 3 || name.length > 50) {
        throw new Error('❌ Workflow name must be between 3 and 50 characters');
    }

    return name;
}

/**
 * Validates source name to prevent injection in secret references
 * @param {string} name - Source name to validate
 * @returns {string} - Sanitized name
 */
function validateSourceName(name) {
    if (!name || typeof name !== 'string') {
        throw new Error('❌ Source name is required');
    }

    // Sanitize: replace any non-alphanumeric characters with underscore
    const sanitized = name.replace(/[^a-zA-Z0-9_]/g, '_');

    if (sanitized.length < 1 || sanitized.length > 30) {
        throw new Error('❌ Source name must be between 1 and 30 characters');
    }

    return sanitized;
}

/**
 * Validates endpoint URL to prevent SSRF attacks
 * @param {string} url - URL to validate
 * @returns {string} - Validated URL
 * @throws {Error} - If validation fails
 */
function validateEndpoint(url) {
    if (!url || typeof url !== 'string') {
        throw new Error('❌ Endpoint URL is required');
    }

    try {
        const parsed = new URL(url);

        // Whitelist allowed protocols
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            throw new Error('❌ Only HTTP and HTTPS protocols are allowed');
        }

        // Block internal/private IP addresses (SSRF prevention)
        const hostname = parsed.hostname.toLowerCase();

        // Block localhost
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
            throw new Error('❌ Localhost addresses are not allowed');
        }

        // Block private IP ranges
        if (hostname.startsWith('192.168.') ||
            hostname.startsWith('10.') ||
            hostname.match(/^172\.(1[6-9]|2[0-9]|3[01])\./)) {
            throw new Error('❌ Private IP addresses are not allowed');
        }

        return url;
    } catch (error) {
        if (error.message.startsWith('❌')) {
            throw error;
        }
        throw new Error('❌ Invalid URL format');
    }
}

/**
 * Validates number of sources
 * @param {number} num - Number of sources
 * @returns {number} - Validated number
 */
function validateNumSources(num) {
    const parsed = parseInt(num, 10);

    if (isNaN(parsed) || parsed < 2 || parsed > 5) {
        throw new Error('❌ Number of sources must be between 2 and 5');
    }

    return parsed;
}

// ============================================
// WORKFLOW TEMPLATE
// ============================================

const WORKFLOW_TEMPLATE = {
    id: 'dataflow_multi_agent',
    namespace: 'dataflow',
    version: '1.0',
    description: 'Multi-source data aggregation with AI-powered summarization and decision-making',
    triggers: [{
        id: 'scheduled_trigger',
        type: 'io.kestra.plugin.core.trigger.Schedule',
        cron: '*/5 * * * *'
    }],
    tasks: []
};

// ============================================
// MAIN FUNCTION
// ============================================

async function main() {
    try {
        console.log('\n🤖 DataFlow Agent - Workflow Generator\n');
        console.log('This CLI will help you create a Kestra workflow for multi-source data aggregation.\n');

        // Step 1: Get workflow configuration
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'workflowName',
                message: 'Workflow name:',
                default: 'my_data_pipeline',
                validate: (input) => {
                    try {
                        validateWorkflowName(input);
                        return true;
                    } catch (error) {
                        return error.message;
                    }
                }
            },
            {
                type: 'number',
                name: 'numSources',
                message: 'How many data sources? (2-5):',
                default: 3,
                validate: (input) => {
                    try {
                        validateNumSources(input);
                        return true;
                    } catch (error) {
                        return error.message;
                    }
                }
            },
            {
                type: 'confirm',
                name: 'includeSynthesis',
                message: 'Include synthesis/decision agent?',
                default: true
            }
        ]);

        // Validate answers
        const workflowName = validateWorkflowName(answers.workflowName);
        const numSources = validateNumSources(answers.numSources);

        console.log(`\n📊 Configuring ${numSources} data sources...\n`);

        // Step 2: Configure each data source
        const dataSources = [];

        for (let i = 0; i < numSources; i++) {
            console.log(`\n--- Data Source ${i + 1} of ${numSources} ---`);

            const source = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'type',
                    message: `Source ${i + 1} type:`,
                    choices: ['REST API', 'Database', 'CSV File', 'WebSocket', 'Custom']
                },
                {
                    type: 'input',
                    name: 'name',
                    message: `Source ${i + 1} name:`,
                    default: `source_${i + 1}`,
                    validate: (input) => {
                        try {
                            validateSourceName(input);
                            return true;
                        } catch (error) {
                            return error.message;
                        }
                    }
                },
                {
                    type: 'input',
                    name: 'endpoint',
                    message: `Source ${i + 1} endpoint/path:`,
                    default: 'https://api.example.com/data',
                    validate: (input) => {
                        try {
                            validateEndpoint(input);
                            return true;
                        } catch (error) {
                            return error.message;
                        }
                    }
                },
                {
                    type: 'list',
                    name: 'auth',
                    message: `Source ${i + 1} authentication:`,
                    choices: ['None', 'Bearer Token', 'API Key', 'Basic Auth']
                }
            ]);

            // Sanitize source name
            source.name = validateSourceName(source.name);
            source.endpoint = validateEndpoint(source.endpoint);

            dataSources.push(source);
        }

        console.log('\n⚙️  Generating workflow...\n');

        // Step 3: Build workflow
        const workflow = { ...WORKFLOW_TEMPLATE };
        workflow.id = workflowName;
        workflow.description = `Multi-source data aggregation workflow with ${numSources} sources`;

        // Step 4: Add fetch tasks for each data source
        dataSources.forEach((source, idx) => {
            const fetchTaskId = `fetch_${source.name}`;

            if (source.type === 'REST API') {
                workflow.tasks.push({
                    id: fetchTaskId,
                    type: 'io.kestra.plugin.core.http.Request',
                    url: source.endpoint,
                    method: 'GET',
                    headers: source.auth !== 'None' ? {
                        Authorization: `{{ secret('${source.name}_token') }}`
                    } : {},
                    timeout: 'PT30S',
                    errorOnEmptyResponse: false
                });
            } else if (source.type === 'Database') {
                workflow.tasks.push({
                    id: fetchTaskId,
                    type: 'io.kestra.plugin.core.log.Log',
                    message: `Database query simulation for ${source.name} - timestamp: {{ now() }}`
                });
            } else if (source.type === 'CSV File') {
                workflow.tasks.push({
                    id: fetchTaskId,
                    type: 'io.kestra.plugin.core.http.Download',
                    uri: source.endpoint,
                    timeout: 'PT30S'
                });
            } else if (source.type === 'WebSocket') {
                workflow.tasks.push({
                    id: fetchTaskId,
                    type: 'io.kestra.plugin.core.http.Request',
                    url: source.endpoint,
                    method: 'GET',
                    timeout: 'PT30S'
                });
            } else {
                // Custom type
                workflow.tasks.push({
                    id: fetchTaskId,
                    type: 'io.kestra.plugin.core.log.Log',
                    message: `Custom data source: ${source.name}`
                });
            }

            // Step 5: Add summarization agent for each source
            workflow.tasks.push({
                id: `summarize_${source.name}`,
                type: 'io.kestra.plugin.ai.agent.AIAgent',
                systemMessage: `You are a specialized ${source.type} data analyst. Your role is to:
1. Analyze the provided data from ${source.name}
2. Extract key metrics and values
3. Identify any anomalies or unexpected patterns
4. Format response as valid JSON

Always respond in this JSON structure:
{
  "summary": "brief 1-2 sentence summary",
  "key_metrics": {"metric1": "value1", "metric2": "value2"},
  "anomalies": ["anomaly1", "anomaly2"],
  "confidence": 0.95,
  "source": "${source.name}"
}`,
                prompt: `Analyze this ${source.type} data and provide structured summary:
{{ outputs.${fetchTaskId}.body | default('No data received') }}

Focus on: trends, critical values, and any unusual patterns.`
            });
        });

        // Step 6: Add synthesis/decision agent if requested
        if (answers.includeSynthesis) {
            const summaryRefs = dataSources
                .map((s) => `- ${s.name}: {{ outputs.summarize_${s.name}.output }}`)
                .join('\n');

            workflow.tasks.push({
                id: 'synthesis_decision_agent',
                type: 'io.kestra.plugin.ai.agent.AIAgent',
                systemMessage: `You are an AUTONOMOUS DECISION-MAKING AGENT with deep analytical capabilities.

You have received summaries from ${numSources} independent data sources.

Your responsibilities:
- Synthesize insights from all ${numSources} sources
- Identify correlations and patterns across sources
- Detect anomalies that require immediate action
- Recommend specific actions with confidence scores
- Prioritize multiple decisions by impact

CRITICAL: Always respond ONLY with valid JSON in this exact structure:
{
  "analysis_timestamp": "ISO-8601 timestamp",
  "overall_status": "critical|warning|normal",
  "confidence_score": 0.95,
  "key_findings": [
    {
      "finding": "description",
      "source": "which data source(s)",
      "severity": "high|medium|low"
    }
  ],
  "autonomous_decision": "specific action to execute",
  "recommended_actions": [
    {
      "action": "description",
      "priority": "high|medium|low",
      "estimated_impact": "description"
    }
  ],
  "reasoning": "step-by-step explanation of decision"
}`,
                prompt: `Synthesize all data source summaries and make autonomous decisions:

${summaryRefs}

Tasks:
1. Cross-reference all ${numSources} summaries
2. Identify any patterns appearing in multiple sources
3. Detect anomalies requiring attention
4. Make specific autonomous decisions
5. Rate confidence in your decision (0-1)

Respond ONLY with the JSON structure specified in your system message.`
            });

            // Add decision execution log
            workflow.tasks.push({
                id: 'execute_decision_log',
                type: 'io.kestra.plugin.core.log.Log',
                message: `📊 DECISION EXECUTION LOG
Timestamp: {{ now() }}
Decision: {{ outputs.synthesis_decision_agent.output }}`
            });
        }

        // Step 7: Write workflow to file
        const outputPath = path.join(process.cwd(), `${workflowName}.yml`);
        const yamlContent = yaml.stringify(workflow);

        try {
            fs.writeFileSync(outputPath, yamlContent, 'utf8');

            console.log('✅ Workflow generated successfully!\n');
            console.log(`📄 File: ${outputPath}`);
            console.log(`📊 Sources: ${numSources}`);
            console.log(`🤖 AI Agents: ${numSources + (answers.includeSynthesis ? 1 : 0)}`);
            console.log(`🎯 Decision Agent: ${answers.includeSynthesis ? 'Yes' : 'No'}\n`);

            console.log('📋 Next steps:');
            console.log(`1. Review the workflow: ${outputPath}`);
            console.log(`2. Configure secrets in Kestra for authentication`);
            console.log(`3. Deploy to Kestra: kestra flow update --file ${outputPath}`);
            console.log(`4. Monitor execution: http://localhost:8080\n`);

            console.log('🔐 Required secrets (if using authentication):');
            dataSources.forEach(source => {
                if (source.auth !== 'None') {
                    console.log(`   - ${source.name}_token`);
                }
            });
            console.log('');

        } catch (error) {
            throw new Error(`Failed to write workflow file: ${error.message}`);
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('\n💡 Tip: Make sure all inputs are valid and try again.\n');
        process.exit(1);
    }
}

// ============================================
// ENTRY POINT
// ============================================

// Handle uncaught errors gracefully
process.on('unhandledRejection', (error) => {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
});


// Run main function only if executed directly (not imported)
if (require.main === module) {
    main().catch((error) => {
        console.error('\n💥 Fatal error:', error.message);
        process.exit(1);
    });
}

// Export functions for testing
module.exports = {
    validateWorkflowName,
    validateSourceName,
    validateEndpoint,
    validateNumSources,
    main
};
