#!/usr/bin/env node
// Starts every service with tsx watch plus the Vite dev server, all in one terminal with prefixed output.
import { spawn } from 'node:child_process';

const services = [
  ['registro', 'services/registro-civil'],
  ['tributacion', 'services/tributacion'],
  ['ccss', 'services/ccss'],
  ['municipalidad', 'services/municipalidad'],
  ['bus', 'services/bus'],
  ['api', 'apps/api'],
];
const procs = [];
const colours = [32, 33, 34, 35, 36, 92, 93];

function run(name, cmd, args, i) {
  const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], env: process.env, shell: process.platform === 'win32' });
  const tag = `\x1b[${colours[i % colours.length]}m[${name.padEnd(13)}]\x1b[0m `;
  for (const stream of [p.stdout, p.stderr]) {
    let buf = '';
    stream.on('data', (d) => {
      buf += d.toString();
      const lines = buf.split('\n');
      buf = lines.pop();
      for (const l of lines) process.stdout.write(tag + l + '\n');
    });
  }
  p.on('exit', (code) => process.stdout.write(tag + `exited (${code})\n`));
  procs.push(p);
}

services.forEach(([name, dir], i) => run(name, 'npx', ['tsx', 'watch', `${dir}/src/index.ts`], i));
run('web', 'npm', ['run', 'dev', '-w', 'apps/web'], services.length);

const stop = () => {
  for (const p of procs) p.kill('SIGTERM');
  setTimeout(() => process.exit(0), 300);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
console.log('PuraVidaGov dev: portal http://localhost:5173 · api http://localhost:3001 · bus http://localhost:4000');
