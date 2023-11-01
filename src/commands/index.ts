import { ICommand } from './ICommand';
import { UpCommand } from './up/up';

export const CommandRegistry: Record<string, ICommand> = {
  up: new UpCommand(),
};