import { ICommand } from './ICommand';
import { SyncUpCommand } from './syncUp/syncUp';
import { UpCommand } from './up/up';

export const CommandRegistry: Record<string, ICommand> = {
  up: new UpCommand(),
  syncUp: new SyncUpCommand(),
};