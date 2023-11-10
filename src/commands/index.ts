import { myContainer } from '../inversify/myContainer';
import { ICommand } from './ICommand';
import { BackCommand } from './back/back';
import { BranchCommand } from './branch/branch';
import { CommitCommand } from './commit/commit';
import { DownCommand } from './down/down';
import { FeatureCommand } from './feature/feature';
import { NextCommand } from './next/next';
import { SyncCommand } from './sync/sync';
import { UpCommand } from './up/up';

export const CommandRegistry: Record<string, ICommand> = {
  down: myContainer.resolve<DownCommand>(DownCommand),
  up: myContainer.resolve<UpCommand>(UpCommand),
  sync: myContainer.resolve<SyncCommand>(SyncCommand),
  commit: myContainer.resolve<CommitCommand>(CommitCommand),
  next: myContainer.resolve<NextCommand>(NextCommand),
  back: myContainer.resolve<BackCommand>(BackCommand),
  branch: myContainer.resolve<BranchCommand>(BranchCommand),
  feature: myContainer.resolve<FeatureCommand>(FeatureCommand)
};