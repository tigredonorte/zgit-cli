#!/usr/bin/env node
import 'reflect-metadata';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { CommandRegistry } from './commands';

process.on('uncaughtException', (error) => {
  console.error(error.message);
  process.exit(1); // Exit with a failure code
});

async function main() {
  const yargsInstance = yargs(hideBin(process.argv))
    .strict()
    .help()
    .alias('h', 'help')
    .fail((msg, err, yargs) => {
      if (err) {
        return;
      }

      console.error('Invalid command:', msg);
      console.error(yargs.help()); 
      process.exit(1);
    });


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