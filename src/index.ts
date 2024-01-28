#!/usr/bin/env node
import arg from 'arg';

import { createIssue } from './createIssue';
import { renderHelp } from './renderHelp';
import { handleError } from './utils/errors';

export type Input = typeof args;

const args = arg({
  '--help': Boolean,
  '--version': Boolean,
  '--template': String,
  '-h': '--help',
  '-v': '--version',
  '-t': '--template',
});

if (args['--help']) {
  console.log(renderHelp());
  process.exit(0);
}

if (args['--version']) {
  console.log(require('../package.json').version);
  process.exit(0);
}

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

await createIssue(args).catch(handleError);
