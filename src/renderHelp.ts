import chalk from 'chalk';

import { detectPackageManager } from './utils/node';

export function renderHelp() {
  const manager = detectPackageManager();

  // Note, template literal is broken with bun build
  return `
  ${chalk.bold('Usage')}
    ${chalk.dim('$')} ${manager} create issue
    ${chalk.dim('$')} ${manager} create issue [owner]
    ${chalk.dim('$')} ${manager} create issue [owner] [repository]

  ${chalk.bold('Options')}
    --version, -v
    --help, -h
  `;
}
