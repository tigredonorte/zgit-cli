import { ICommand } from './ICommand';
import { BackCommand } from './back/back';
import { CommitCommand } from './commit/commit';
import { DownCommand } from './down/down';
import { NextCommand } from './next/next';
import { SyncUpCommand } from './syncUp/syncUp';
import { UpCommand } from './up/up';

export const CommandRegistry: Record<string, ICommand> = {
  down: new DownCommand(),
  up: new UpCommand(),
  syncUp: new SyncUpCommand(),
  commit: new CommitCommand(),
  next: new NextCommand(),
  back: new BackCommand(),
};