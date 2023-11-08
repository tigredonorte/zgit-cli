#!/usr/bin/env node
import 'reflect-metadata';
import { CommandRegistry } from './commands';

function help(commandName: string) {
  if (commandName === 'help' || !commandName) {
    const temp = Object.keys(CommandRegistry).map((commandName) => {
      const command = CommandRegistry[commandName];
      return `${commandName}: ${command.help()}`;
    });
    console.log('Available commands:\n\n' + temp.join('\n\n'));
    process.exit(1);
  }
}

async function main() {
  const [commandName, ...args] = process.argv.slice(2);
  help(commandName);

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