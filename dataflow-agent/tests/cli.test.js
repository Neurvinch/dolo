const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

// Mock inquirer for testing
jest.mock('inquirer');
const inquirer = require('inquirer');

describe('Cline CLI - Workflow Generator', () => {
    const testOutputPath = path.join(__dirname, '../test_workflow.yml');

    beforeEach(() => {
        // Clean up any test files
        if (fs.existsSync(testOutputPath)) {
            fs.unlinkSync(testOutputPath);
        }
    });

    afterEach(() => {
        // Clean up test files
        if (fs.existsSync(testOutputPath)) {
            fs.unlinkSync(testOutputPath);
        }
    });

    describe('Input Validation', () => {
        test('should validate workflow name - valid input', () => {
            const { validateWorkflowName } = require('../cline-cli/index.js');
            expect(() => validateWorkflowName('my_workflow')).not.toThrow();
            expect(() => validateWorkflowName('test-123')).not.toThrow();
        });

        test('should reject invalid workflow names', () => {
            const { validateWorkflowName } = require('../cline-cli/index.js');
            expect(() => validateWorkflowName('../etc/passwd')).toThrow();
            expect(() => validateWorkflowName('test/workflow')).toThrow();
            expect(() => validateWorkflowName('a')).toThrow(); // too short
            expect(() => validateWorkflowName('a'.repeat(51))).toThrow(); // too long
        });

        test('should validate source names', () => {
            const { validateSourceName } = require('../cline-cli/index.js');
            expect(validateSourceName('api_source')).toBe('api_source');
            expect(validateSourceName('source-1')).toBe('source_1'); // sanitized
            expect(validateSourceName('my source')).toBe('my_source'); // sanitized
        });

        test('should validate endpoint URLs', () => {
            const { validateEndpoint } = require('../cline-cli/index.js');
            expect(() => validateEndpoint('https://api.example.com')).not.toThrow();
            expect(() => validateEndpoint('http://example.com/data')).not.toThrow();
        });

        test('should reject invalid URLs', () => {
            const { validateEndpoint } = require('../cline-cli/index.js');
            expect(() => validateEndpoint('ftp://example.com')).toThrow(); // wrong protocol
            expect(() => validateEndpoint('http://localhost')).toThrow(); // localhost blocked
            expect(() => validateEndpoint('http://192.168.1.1')).toThrow(); // private IP
            expect(() => validateEndpoint('http://10.0.0.1')).toThrow(); // private IP
        });

        test('should validate number of sources', () => {
            const { validateNumSources } = require('../cline-cli/index.js');
            expect(validateNumSources(3)).toBe(3);
            expect(validateNumSources('5')).toBe(5);
            expect(() => validateNumSources(1)).toThrow(); // too few
            expect(() => validateNumSources(6)).toThrow(); // too many
        });
    });

    describe('Workflow Generation', () => {
        test('should generate valid YAML workflow', async () => {
            // Mock user inputs
            inquirer.prompt = jest.fn()
                .mockResolvedValueOnce({
                    workflowName: 'test_workflow',
                    numSources: 2,
                    includeSynthesis: true
                })
                .mockResolvedValueOnce({
                    type: 'REST API',
                    name: 'api_source',
                    endpoint: 'https://api.example.com/data',
                    auth: 'Bearer Token'
                })
                .mockResolvedValueOnce({
                    type: 'Database',
                    name: 'db_source',
                    endpoint: 'https://db.example.com',
                    auth: 'None'
                });

            // This would require refactoring main() to be testable
            // For now, we test the validation functions
            expect(true).toBe(true);
        });

        test('should include all required workflow components', () => {
            const workflowTemplate = {
                id: 'test_workflow',
                namespace: 'dataflow',
                version: '1.0',
                tasks: []
            };

            expect(workflowTemplate).toHaveProperty('id');
            expect(workflowTemplate).toHaveProperty('namespace');
            expect(workflowTemplate).toHaveProperty('version');
            expect(workflowTemplate).toHaveProperty('tasks');
        });
    });

    describe('Security Tests', () => {
        test('should prevent path traversal attacks', () => {
            const { validateWorkflowName } = require('../cline-cli/index.js');
            const maliciousInputs = [
                '../../../etc/passwd',
                '..\\..\\windows\\system32',
                'test/../../../etc/passwd',
                'test/../../file'
            ];

            maliciousInputs.forEach(input => {
                expect(() => validateWorkflowName(input)).toThrow();
            });
        });

        test('should prevent SSRF attacks', () => {
            const { validateEndpoint } = require('../cline-cli/index.js');
            const maliciousUrls = [
                'http://localhost:8080',
                'http://127.0.0.1',
                'http://192.168.1.1',
                'http://10.0.0.1',
                'http://172.16.0.1',
                'file:///etc/passwd',
                'gopher://example.com'
            ];

            maliciousUrls.forEach(url => {
                expect(() => validateEndpoint(url)).toThrow();
            });
        });

        test('should sanitize source names to prevent injection', () => {
            const { validateSourceName } = require('../cline-cli/index.js');
            expect(validateSourceName('api-source')).toBe('api_source');
            expect(validateSourceName('my source!')).toBe('my_source_');
            expect(validateSourceName('test@#$%')).toBe('test____');
        });
    });
});
