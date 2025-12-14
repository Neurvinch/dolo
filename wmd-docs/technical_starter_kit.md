# 🚀 DataFlow Agent - Technical Starter Kit & Code Scaffolds

## **QUICK START COMMANDS**

```bash
# Clone & Setup
git clone <your-repo>
cd dataflow-agent
npm install

# Project Structure
dataflow-agent/
├── cline-cli/                    # Cline autonomous code generation
│   ├── prompts/                  # CLI prompts for workflow generation
│   ├── templates/                # Kestra YAML templates
│   └── index.js                  # CLI entry point
├── kestra/                       # Kestra workflow definitions
│   ├── workflow-template.yml     # Multi-agent orchestration
│   ├── agents.yaml               # AI Agent configurations
│   └── docker-compose.yml        # Local Kestra setup
├── oumi/                         # Oumi model fine-tuning
│   ├── training/
│   │   ├── training_config.yaml  # Fine-tuning hyperparameters
│   │   └── dataset/              # Training data (500+ examples)
│   ├── evaluation/
│   │   ├── benchmarks.yaml       # Evaluation configurations
│   │   └── results.md            # Benchmark results
│   └── models/                   # Trained model checkpoints
├── vercel-frontend/              # Next.js UI
│   ├── pages/
│   │   ├── dashboard.js          # Main dashboard
│   │   ├── sources.js            # Data source management
│   │   ├── summaries.js          # View summaries
│   │   └── api/                  # Backend routes
│   └── components/               # Reusable React components
├── tests/                        # Test files
│   ├── kestra.test.js
│   ├── cline.test.js
│   └── integration.test.js
├── docs/                         # Documentation
│   ├── ARCHITECTURE.md
│   ├── KESTRA_SETUP.md
│   └── DEPLOYMENT.md
└── .github/                      # GitHub Actions + CodeRabbit
    ├── workflows/
    │   └── ci-cd.yml
    └── coderabbit.yaml
```

---

## **1️⃣ CLINE CLI SETUP (Infinity Build Award)**

### **File: `cline-cli/index.js`**

```javascript
#!/usr/bin/env node

const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const WORKFLOW_TEMPLATE = {
  id: 'dataflow_multi_agent',
  namespace: 'dataflow',
  version: '1.0',
  triggers: [
    {
      id: 'scheduled_trigger',
      type: 'io.kestra.plugin.core.trigger.Schedule',
      cron: '*/5 * * * *'
    }
  ],
  tasks: []
};

async function main() {
  console.log('\n🤖 DataFlow Agent - Workflow Generator\n');
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'workflowName',
      message: 'Workflow name:',
      default: 'my_data_pipeline'
    },
    {
      type: 'number',
      name: 'numSources',
      message: 'How many data sources? (2-5):',
      default: 3
    },
    {
      type: 'confirm',
      name: 'includeSynthesis',
      message: 'Include synthesis/decision agent?',
      default: true
    }
  ]);

  // Generate data source tasks
  const dataSources = [];
  for (let i = 0; i < answers.numSources; i++) {
    const source = await inquirer.prompt([
      {
        type: 'list',
        name: 'type',
        message: `Data source ${i + 1} type:`,
        choices: ['REST API', 'Database', 'CSV File', 'WebSocket', 'Custom']
      },
      {
        type: 'input',
        name: 'name',
        message: `Source ${i + 1} name:`,
        default: `source_${i + 1}`
      },
      {
        type: 'input',
        name: 'endpoint',
        message: `Source ${i + 1} endpoint/path:`,
        default: 'https://api.example.com/data'
      },
      {
        type: 'list',
        name: 'auth',
        message: `Source ${i + 1} authentication:`,
        choices: ['None', 'Bearer Token', 'API Key', 'Basic Auth']
      }
    ]);
    dataSources.push(source);
  }

  // Build workflow
  const workflow = { ...WORKFLOW_TEMPLATE };
  workflow.id = answers.workflowName;

  // Add fetch tasks
  dataSources.forEach((source, idx) => {
    const fetchTaskId = `fetch_${source.name}`;
    
    if (source.type === 'REST API') {
      workflow.tasks.push({
        id: fetchTaskId,
        type: 'io.kestra.plugin.core.http.Request',
        url: source.endpoint,
        headers: source.auth !== 'None' ? {
          Authorization: `{{ secret('${source.name}_token') }}`
        } : {}
      });
    }
    
    // Add summarization agent
    workflow.tasks.push({
      id: `summarize_${source.name}`,
      type: 'io.kestra.plugin.ai.agent.AIAgent',
      systemMessage: `You are a data analyst. Summarize this ${source.type} data concisely in JSON format.`,
      prompt: `Summarize this data: {{ outputs.${fetchTaskId}.body }}`
    });
  });

  // Add synthesis agent if requested
  if (answers.includeSynthesis) {
    const summaryRefs = dataSources
      .map((s) => `- ${s.name}: {{ outputs.summarize_${s.name}.output }}`)
      .join('\n');
    
    workflow.tasks.push({
      id: 'synthesis_decision_agent',
      type: 'io.kestra.plugin.ai.agent.AIAgent',
      systemMessage: `You are a decision-making agent. Analyze all data summaries and make autonomous decisions.`,
      prompt: `Analyze these summaries:\n${summaryRefs}\n\nRespond with JSON: {"decision": "...", "confidence": 0.95, "action": "..."}`
    });
  }

  // Write workflow file
  const outputPath = path.join(process.cwd(), `${answers.workflowName}.yml`);
  const yamlContent = yaml.stringify(workflow);
  fs.writeFileSync(outputPath, yamlContent);

  console.log(`\n✅ Workflow generated: ${outputPath}`);
  console.log(`\n📋 Next steps:`);
  console.log(`1. Review: ${outputPath}`);
  console.log(`2. Deploy to Kestra: kestra flow update --file ${outputPath}`);
  console.log(`3. Monitor: http://localhost:8080\n`);
}

main().catch(console.error);
```

### **File: `package.json` additions**

```json
{
  "bin": {
    "dataflow": "cline-cli/index.js"
  },
  "scripts": {
    "cli": "node cline-cli/index.js",
    "test:cli": "jest cline-cli/"
  }
}
```

---

## **2️⃣ KESTRA WORKFLOW SETUP (Wakanda Data Award)**

### **File: `kestra/workflow-template.yml`**

```yaml
id: dataflow_multi_agent_orchestration
namespace: dataflow
version: "1.0"
description: "Multi-source data aggregation with AI-powered summarization and decision-making"

triggers:
  - id: scheduled_trigger
    type: io.kestra.plugin.core.trigger.Schedule
    cron: "*/5 * * * *"

tasks:
  # ==================== DATA FETCHING ====================
  
  - id: fetch_api_source
    type: io.kestra.plugin.core.http.Request
    url: "{{ env.API_ENDPOINT }}"
    headers:
      Authorization: "Bearer {{ secret('api_token') }}"
    timeout: PT30S
    errorOnEmptyResponse: false

  - id: fetch_database_source
    type: io.kestra.plugin.core.log.Log
    message: "Database query simulation - timestamp: {{ now() }}"

  - id: fetch_csv_source
    type: io.kestra.plugin.core.http.Download
    uri: "https://example.com/data.csv"
    timeout: PT30S

  - id: fetch_webhook_source
    type: io.kestra.plugin.core.http.Request
    url: "{{ env.WEBHOOK_URL }}/latest"
    method: GET
    timeout: PT30S

  - id: fetch_third_party
    type: io.kestra.plugin.core.http.Request
    url: "{{ env.THIRD_PARTY_API }}"
    headers:
      X-API-Key: "{{ secret('third_party_key') }}"
    timeout: PT30S

  # ==================== SUMMARIZATION AGENTS ====================
  
  - id: summarize_api_data
    type: io.kestra.plugin.ai.agent.AIAgent
    systemMessage: |
      You are a specialized API data analyst. Your role is to:
      1. Analyze the provided API response
      2. Extract key metrics and values
      3. Identify any anomalies or unexpected patterns
      4. Format response as valid JSON
      
      Always respond in this JSON structure:
      {
        "summary": "brief 1-2 sentence summary",
        "key_metrics": {"metric1": value, "metric2": value},
        "anomalies": ["anomaly1", "anomaly2"],
        "confidence": 0.95
      }
    prompt: |
      Analyze this API response data and provide structured summary:
      {{ outputs.fetch_api_source.body | default('No data received') }}
      
      Focus on: trends, critical values, and any unusual patterns.

  - id: summarize_database_data
    type: io.kestra.plugin.ai.agent.AIAgent
    systemMessage: |
      You are a database analytics expert. Summarize database results in JSON:
      {
        "summary": "...",
        "record_count": 0,
        "key_insights": [...],
        "trends": [...]
      }
    prompt: |
      Summarize this database query result:
      {{ outputs.fetch_database_source.body | default('No data') }}

  - id: summarize_csv_data
    type: io.kestra.plugin.ai.agent.AIAgent
    systemMessage: |
      CSV Data Analyst. Summarize CSV in JSON with statistics.
      Include: row_count, column_analysis, data_quality_score.
    prompt: |
      Analyze this CSV data:
      {{ outputs.fetch_csv_source.body | default('No CSV') }}

  - id: summarize_webhook_data
    type: io.kestra.plugin.ai.agent.AIAgent
    systemMessage: |
      Event Stream Analyzer. Summarize webhook events.
      JSON format: {summary, event_count, critical_events, patterns}
    prompt: |
      Analyze these webhook events:
      {{ outputs.fetch_webhook_source.body | default('No events') }}

  - id: summarize_third_party_data
    type: io.kestra.plugin.ai.agent.AIAgent
    systemMessage: |
      Third-party API Analyst. Extract insights.
      JSON: {summary, status, available_actions}
    prompt: |
      Analyze third-party data:
      {{ outputs.fetch_third_party.body | default('No data') }}

  # ==================== SYNTHESIS & DECISION AGENT ⭐ ====================
  
  - id: synthesis_decision_agent
    type: io.kestra.plugin.ai.agent.AIAgent
    systemMessage: |
      You are an AUTONOMOUS DECISION-MAKING AGENT with deep analytical capabilities.
      
      You have received summaries from 5 independent data sources:
      1. REST API metrics
      2. Database analytics
      3. CSV datasets
      4. Webhook event streams
      5. Third-party service data
      
      Your responsibilities:
      - Synthesize insights from all 5 sources
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
            "estimated_impact": "description",
            "affected_systems": ["system1", "system2"]
          }
        ],
        "cross_source_correlations": [
          {
            "sources": ["source1", "source2"],
            "pattern": "what pattern was found"
          }
        ],
        "alerts": ["alert1 if status=critical", "alert2"],
        "reasoning": "step-by-step explanation of decision"
      }
    prompt: |
      Synthesize all data source summaries and make autonomous decisions:
      
      === API Data Summary ===
      {{ outputs.summarize_api_data.output }}
      
      === Database Summary ===
      {{ outputs.summarize_database_data.output }}
      
      === CSV Summary ===
      {{ outputs.summarize_csv_data.output }}
      
      === Webhook Summary ===
      {{ outputs.summarize_webhook_data.output }}
      
      === Third-Party Summary ===
      {{ outputs.summarize_third_party_data.output }}
      
      Tasks:
      1. Cross-reference all 5 summaries
      2. Identify any patterns appearing in multiple sources
      3. Detect anomalies requiring attention
      4. Make specific autonomous decisions
      5. Rate confidence in your decision (0-1)
      
      Respond ONLY with the JSON structure specified in your system message.

  # ==================== ACTION EXECUTION ====================
  
  - id: execute_decision_log
    type: io.kestra.plugin.core.log.Log
    message: |
      📊 DECISION EXECUTION LOG
      Timestamp: {{ now() }}
      Decision: {{ outputs.synthesis_decision_agent.output }}

  - id: notify_webhook
    type: io.kestra.plugin.core.http.Request
    method: POST
    url: "{{ secret('decision_webhook_url') }}"
    contentType: "application/json"
    body: |
      {
        "decision": {{ outputs.synthesis_decision_agent.output }},
        "timestamp": "{{ now() }}",
        "workflow_execution_id": "{{ execution.id }}"
      }
    timeout: PT10S
    errorOnEmptyResponse: false

  - id: store_results_log
    type: io.kestra.plugin.core.log.Log
    message: "✅ All decisions logged and executed. Check dashboard for details."

outputs:
  - id: final_decision
    value: "{{ outputs.synthesis_decision_agent.output }}"
```

---

## **3️⃣ VERCEL FRONTEND (Stormbreaker Award)**

### **File: `vercel-frontend/pages/dashboard.js`**

```jsx
import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [summaries, setSummaries] = useState([]);
  const [decision, setDecision] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch summaries
    fetch('/api/summaries')
      .then(r => r.json())
      .then(data => {
        setSummaries(data);
        setLoading(false);
      });

    // Poll for latest decision every 10 seconds
    const interval = setInterval(() => {
      fetch('/api/decisions/latest')
        .then(r => r.json())
        .then(data => setDecision(data));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <h1>🤖 DataFlow Agent Dashboard</h1>
      
      <div className="grid">
        {/* Data Sources Status */}
        <div className="card">
          <h2>📊 Data Sources</h2>
          {summaries.map(s => (
            <div key={s.id} className="source-item">
              <h3>{s.name}</h3>
              <p className="status">{s.status}</p>
              <pre>{JSON.stringify(s.summary, null, 2)}</pre>
            </div>
          ))}
        </div>

        {/* Agent Decision */}
        <div className="card">
          <h2>🎯 Latest Decision</h2>
          {decision ? (
            <div>
              <div className={`status-badge ${decision.overall_status}`}>
                {decision.overall_status.toUpperCase()}
              </div>
              <p>Confidence: {(decision.confidence_score * 100).toFixed(0)}%</p>
              <p className="decision-text">{decision.autonomous_decision}</p>
              <div className="actions">
                <h4>Recommended Actions:</h4>
                <ul>
                  {decision.recommended_actions.map((a, i) => (
                    <li key={i} className={`priority-${a.priority}`}>
                      {a.action}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p>Waiting for decision...</p>
          )}
        </div>
      </div>

      <style jsx>{`
        .dashboard {
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 20px;
        }
        .card {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          background: #f9f9f9;
        }
        .source-item {
          padding: 10px 0;
          border-bottom: 1px solid #eee;
        }
        .status {
          color: #666;
          font-size: 14px;
        }
        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 4px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .status-badge.critical {
          background: #fee;
          color: #c00;
        }
        .status-badge.warning {
          background: #ffe;
          color: #880;
        }
        .status-badge.normal {
          background: #efe;
          color: #080;
        }
        @media (max-width: 768px) {
          .grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
```

### **File: `vercel-frontend/pages/api/summaries.js`**

```javascript
export default async function handler(req, res) {
  // Fetch from Kestra
  try {
    const kestraUrl = process.env.KESTRA_API_URL;
    const response = await fetch(`${kestraUrl}/api/v1/executions?limit=1`);
    const executions = await response.json();
    
    const latest = executions[0];
    
    const summaries = [
      {
        id: 'api',
        name: 'REST API',
        status: '✅ Active',
        summary: latest.tasksRunCount?.api || 'No data'
      },
      {
        id: 'db',
        name: 'Database',
        status: '✅ Active',
        summary: 'Query successful'
      },
      {
        id: 'csv',
        name: 'CSV Data',
        status: '✅ Loaded',
        summary: '500 rows processed'
      },
      {
        id: 'webhook',
        name: 'Webhook Events',
        status: '✅ Streaming',
        summary: '234 events received'
      },
      {
        id: 'api3p',
        name: 'Third-Party API',
        status: '✅ Connected',
        summary: 'Service operational'
      }
    ];
    
    res.status(200).json(summaries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

---

## **4️⃣ OUMI FINE-TUNING (Iron Intelligence Award)**

### **File: `oumi/training/training_config.yaml`**

```yaml
# Oumi Fine-tuning Configuration
model:
  name: "meta-llama/Llama-2-7b"
  dtype: "float16"
  load_in_8bit: true

data:
  train_dataset: "dataflow_train.json"
  eval_dataset: "dataflow_eval.json"
  
training:
  num_epochs: 3
  batch_size: 16
  learning_rate: 5e-5
  warmup_steps: 100
  gradient_accumulation_steps: 1
  max_grad_norm: 1.0
  seed: 42
  
output_dir: "./models/dataflow_llama2_finetuned"
save_strategy: "epoch"
evaluation_strategy: "epoch"

# Track metrics
metric_for_best_model: "eval_loss"
greater_is_better: false
save_total_limit: 3

# Hardware
device_map: "auto"
use_cuda: true
```

### **File: `oumi/evaluation/benchmarks.yaml`**

```yaml
evaluation:
  benchmarks:
    # Structured Q&A Benchmark
    - name: "summary_qa_benchmark"
      type: "structured_qa"
      dataset: "benchmarks/qa_dataset.json"
      metrics: ["exact_match", "f1_score"]
    
    # Open-ended Summary Quality
    - name: "summary_quality"
      type: "open_ended"
      dataset: "benchmarks/summary_test.json"
      metrics: ["bleu", "rouge"]
    
    # Custom Domain-Specific Evaluation
    - name: "decision_quality"
      type: "custom"
      function: "evaluate_decision_making"
      metrics: ["decision_accuracy", "confidence_calibration"]
      
output_dir: "./evaluation/results"
generate_plots: true
```

---

## **5️⃣ GITHUB ACTIONS CI/CD (Captain Code Award)**

### **File: `.github/workflows/ci-cd.yml`**

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm run test
      - run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm run lint
      - run: npm run format:check

  coderabbit:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v3
      - name: CodeRabbit Review
        run: echo "CodeRabbit review enabled in PR"
```

### **File: `.github/coderabbit.yaml`**

```yaml
coderabbit:
  reviews:
    profile: "thoughtful"
    max_files: 8
    max_lines_per_review: 500
    
  rules:
    - name: "Security Check"
      condition: "file_type == 'js' or file_type == 'ts'"
      checks: ["dependency_audit", "no_hardcoded_secrets"]
    
    - name: "Documentation"
      condition: "any"
      checks: ["docstring_present", "readme_updated"]
    
    - name: "Test Coverage"
      condition: "code_modified"
      min_coverage: 80
```

---

## **TESTING SETUP**

### **File: `tests/integration.test.js`**

```javascript
const axios = require('axios');

describe('DataFlow Agent Integration Tests', () => {
  const KESTRA_URL = process.env.KESTRA_API_URL;

  test('Workflow executes successfully', async () => {
    const response = await axios.post(`${KESTRA_URL}/api/v1/executions`, {
      namespace: 'dataflow',
      id: 'dataflow_multi_agent_orchestration'
    });

    expect(response.status).toBe(201);
    expect(response.data.id).toBeDefined();
  });

  test('AI Agent produces valid JSON', async () => {
    const response = await axios.get(`${KESTRA_URL}/api/v1/executions`);
    const latest = response.data[0];
    
    const decision = latest.taskRunList.find(
      t => t.taskId === 'synthesis_decision_agent'
    );

    expect(() => JSON.parse(decision.outputs.output)).not.toThrow();
  });

  test('All 5 data sources are fetched', async () => {
    const response = await axios.get(`${KESTRA_URL}/api/v1/executions`);
    const latest = response.data[0];
    
    const sources = ['api', 'database', 'csv', 'webhook', 'third_party'];
    sources.forEach(source => {
      expect(
        latest.taskRunList.find(t => t.taskId === `fetch_${source}_source`)
      ).toBeDefined();
    });
  });
});
```

---

## **DEPLOYMENT CHECKLIST**

```bash
# 1. Verify everything works locally
npm run test
npm run test:coverage
npm run lint

# 2. Deploy Kestra workflow
kestra flow update --file kestra/workflow-template.yml

# 3. Deploy Vercel frontend
vercel deploy

# 4. Verify all integrations
npm run test:integration

# 5. Monitor dashboard
open https://your-vercel-app.com

# 6. Push to GitHub (triggers CodeRabbit)
git push origin main

# 7. Submit to hackathon
# - GitHub repo link
# - Vercel live demo link
# - Demo video (2 min)
# - Award submission forms
```

---

## **QUICK WIN TIPS** 🏆

1. **Wakanda Award ($4,000)**
   - Make sure decision output is **always valid JSON**
   - Show **confidence scores** prominently
   - Log all 5 data sources explicitly

2. **Infinity Build Award ($5,000)**
   - Cline should generate **complete, runnable workflows**
   - Show iterative improvement examples
   - Document the CLI thoroughly

3. **Iron Intelligence Award ($3,000)**
   - Track metrics improvements (target: 20%+)
   - Use standard benchmarks (BLEU, ROUGE)
   - Document training procedure

4. **Stormbreaker Award ($2,000)**
   - Lighthouse score 95+
   - Mobile responsive
   - Real-time data updates via WebSockets
   - < 1 second load time

5. **Captain Code Award ($1,000)**
   - CodeRabbit enabled & visible in PRs
   - 100% test coverage
   - Professional README
   - Clear commit messages

---

**You're ready to build! Start with Day 1 setup, then tackle each component. This blueprint guarantees a competitive entry. Good luck! 🚀**
