const inquirer = require("inquirer");
const fs = require("fs");
const path = require("path");
const yaml = require("yaml");
const { version } = require("os");

const WORKFLOW_TEMPLATE = {
    id: 'dataflow_multi_agent',
    namespace: 'dataflow',
    version: '1.0',
    triggers: [{
        id: 'scheduled_trigger',
        type: 'io.kestra.plugin.core.trigger.Schedule',
        cron: '*/5 * * * *'
    }
    ],
    tasks: []
};


 async function main() {

    console.log('\n DataFlow Agent - WorkFlow Generator\n')

    const answers = await inquirer.createPromptModule([
        {
            type: 'input',
            name: 'workflow_name',
            message: 'Workflow name:',
            default: 'my_data_pipeline',
        },
        {
            type: 'number',
            name : 'numSources',
            message: 'How many data sources? (2-5)',
            default: 3
        },
        {
            type: 'confirm',
            name: 'includeSynthesis',
            message: 'Include synthesis/decision agent?',
            default: true
        }
    ]);

    
 }

