import { ICommand } from './ICommand';
import { CommitCommand } from './commit/commit';
import { DownCommand } from './down/down';
import { SyncUpCommand } from './syncUp/syncUp';
import { UpCommand } from './up/up';

export const CommandRegistry: Record<string, ICommand> = {
  down: new DownCommand(),
  up: new UpCommand(),
  syncUp: new SyncUpCommand(),
  commit: new CommitCommand(),
};