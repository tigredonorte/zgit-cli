#!/usr/bin/env node

import { CommandRegistry } from './commands';

async function main() {
  const [commandName, ...args] = process.argv.slice(2);
  const command = CommandRegistry[commandName];

  if (!command) {
    console.error(`Unknown command: ${commandName}`);
    console.error('Available commands:', Object.keys(CommandRegistry).join(', '));
    return;
  }

  try {
    await command.execute(...args);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
  }
}

main();