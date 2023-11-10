#!/usr/bin/env node
import 'reflect-metadata';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { CommandRegistry } from './commands';

async function main() {
  const yargsInstance = yargs(hideBin(process.argv));

  Object.keys(CommandRegistry).sort().map((commandName) => {
    const command = CommandRegistry[commandName];

    yargsInstance.command(
      commandName,
      command.help(),
      (yargs) => command.configure(yargs),
      (argv) => command.execute(argv)
    );
    return `${commandName}\n${command.help()}`;
  });

  return yargsInstance.parse();
}

main();