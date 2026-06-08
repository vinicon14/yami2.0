#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// When pkg bundles this, __dirname points to the app root
const coreDir = path.join(__dirname, 'runtime', 'core');
const yamiMjs = path.join(coreDir, 'yami.mjs');

const proc = spawn('node', [yamiMjs], {
  stdio: 'inherit',
  cwd: __dirname
});

process.exitCode = proc.exitCode || 0;
