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


