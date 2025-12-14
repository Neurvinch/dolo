#!/usr/bin/env node

/**
 * Automated CLI Test Script
 * This script tests the CLI by simulating user inputs
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Starting Automated CLI Test...\n');

// Spawn the CLI process
const cli = spawn('node', ['cline-cli/index.js'], {
    cwd: path.join(__dirname, '..'),
    stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';

// Capture output
cli.stdout.on('data', (data) => {
    output += data.toString();
    console.log(data.toString());
});

cli.stderr.on('data', (data) => {
    console.error('Error:', data.toString());
});

// Simulate user inputs
setTimeout(() => {
    console.log('\n📝 Sending input: test_workflow');
    cli.stdin.write('test_workflow\n');
}, 1000);

setTimeout(() => {
    console.log('📝 Sending input: 3 (number of sources)');
    cli.stdin.write('3\n');
}, 2000);

setTimeout(() => {
    console.log('📝 Sending input: Yes (include synthesis)');
    cli.stdin.write('y\n');
}, 3000);

// Source 1
setTimeout(() => {
    console.log('📝 Configuring Source 1: REST API');
    cli.stdin.write('\n'); // Select REST API (first option)
}, 4000);

setTimeout(() => {
    cli.stdin.write('api_source\n'); // Source name
}, 5000);

setTimeout(() => {
    cli.stdin.write('https://api.example.com/data\n'); // Endpoint
}, 6000);

setTimeout(() => {
    cli.stdin.write('\n'); // Auth: None (first option)
}, 7000);

// Source 2
setTimeout(() => {
    console.log('📝 Configuring Source 2: Database');
    cli.stdin.write('\x1B[B\n'); // Down arrow to Database
}, 8000);

setTimeout(() => {
    cli.stdin.write('db_source\n');
}, 9000);

setTimeout(() => {
    cli.stdin.write('https://db.example.com\n');
}, 10000);

setTimeout(() => {
    cli.stdin.write('\n');
}, 11000);

// Source 3
setTimeout(() => {
    console.log('📝 Configuring Source 3: CSV File');
    cli.stdin.write('\x1B[B\x1B[B\n'); // Down arrow twice to CSV
}, 12000);

setTimeout(() => {
    cli.stdin.write('csv_source\n');
}, 13000);

setTimeout(() => {
    cli.stdin.write('https://example.com/data.csv\n');
}, 14000);

setTimeout(() => {
    cli.stdin.write('\n');
    cli.stdin.end(); // Close input
}, 15000);

cli.on('close', (code) => {
    console.log(`\n✅ CLI process exited with code ${code}`);

    if (code === 0) {
        console.log('✅ CLI Test PASSED!');
        console.log('\n📄 Check for generated file: test_workflow.yml');
    } else {
        console.log('❌ CLI Test FAILED!');
    }

    process.exit(code);
});

// Timeout after 20 seconds
setTimeout(() => {
    console.log('\n⏱️  Test timeout - killing process');
    cli.kill();
    process.exit(1);
}, 20000);
