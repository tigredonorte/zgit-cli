import { prompt } from 'enquirer';
import { inject, injectable } from 'inversify';
import { SimpleGit } from 'simple-git';
import { ArgumentsCamelCase, Argv } from 'yargs';
import { IBranchHelper, IChildrenHelper, ILoggerHelper, IParentHelper } from '../../helpers';
import TYPES from '../../inversify/types';
import { ICommand } from '../ICommand';

type IPushOptions = '' | 'current' | 'current,all' | 'all';
export interface SyncOptions {
  target?: string;
  down: boolean;
  full: boolean;
}

@injectable()
export class SyncCommand implements ICommand<SyncOptions> {

  public constructor(
    @inject(TYPES.SimpleGit) private git: SimpleGit,
    @inject(TYPES.ParentHelper) private parentHelper: IParentHelper,
    @inject(TYPES.BranchHelper) private branchHelper: IBranchHelper,
    @inject(TYPES.LoggerHelper) private logger: ILoggerHelper,
    @inject(TYPES.ChildrenHelper) private childrenHelper: IChildrenHelper,
  ) {}

  public help(): string {
    return 'Rebases the parent branches on top of the current branch';
  }

  public configure(yargs: Argv<SyncOptions>): Argv<SyncOptions> {
    return yargs
      .positional('target', {
        describe: 'target branch to rebase on top of',
        type: 'string',
        required: false,
      })
      .positional('down', {
        describe: 'should sync up or down. Defaults to up',
        type: 'boolean',
        required: true,
        default: false,
      })
      .positional('full', {
        describe: 'should sync all parents (if is up). Defaults to false (only syncs the first parent/child)',
        type: 'boolean',
        required: true,
        default: false,
      });
  }

  public async rebase(target: string): Promise<void> {
    this.logger.log(`Rebasing current branch on top of ${target}`);
    try {
      await this.git.rebase([target]);
    } catch (error) {
      await this.checkStatus('rebase');
    }
    await this.checkStatus('rebase');
    this.logger.log(`Rebasing finished successfully on top of ${target}`);
  }

  public async checkStatus(title: string): Promise<void> {
    const status = await this.git.status();
    if (!status.conflicted || status.conflicted.length === 0) {
      this.logger.log(`${title} finished successfully`);
      return;
    }

    const answer: { action: string } = await prompt({
      type: 'select',
      name: 'action',
      message: `'Conflicts detected. Do you want to solve them or abort the ${title}?`,
      choices: ['Solve', 'Abort']
    });

    if (answer.action === 'Abort') {
      throw new Error(`${title} Aborting and exiting script. Please solve the conflicts and run the script again`);
    }

    return this.checkStatus(title);
  }

  public async push(pushOptions: string | undefined, currentOption: 'all' | 'current'): Promise<void> {
    if (!pushOptions?.includes(currentOption)) {
      this.logger.info('skip push');
      return;
    }

    const result2 = await this.git.push('origin', 'HEAD', ['--force']);
    this.logger.info('Pushed to origin HEAD with force. \n', result2.remoteMessages.all.join('\n'));
  }

  public async execute(args?: ArgumentsCamelCase<SyncOptions>): Promise<void> {
    try {
      const currentBranch = await this.branchHelper.getCurrentBranch();
      const currentStash = await this.createStash(currentBranch);

      let pushOptions: IPushOptions = 'current';
      if (args?.target) {
        await this.rebase(args.target);
        await this.push(pushOptions, 'current');
      } else if (args?.down) {
        await this.syncDown(currentBranch);
        await this.push(pushOptions, 'current');
      } else {
        pushOptions = await this.getPushOptions();
        await this.syncUp(currentBranch, args?.full, pushOptions);
      }

      await this.git.checkout(currentBranch);
      await this.applyStash(currentStash);
    } catch (error) {
      await this.git.stash(['drop']);
      throw error;
    }
  }
  
  public async syncUp(currentBranch: string, full?: boolean, pushOptions?: IPushOptions): Promise<void> {
    const { firstParent, reversedParentBranches } = await this.getSyncBranchOrder(currentBranch, full);

    await this.git.fetch('origin/main');

    let lastBranch = full ? 'origin/main' : firstParent;
    if (!full && firstParent === 'main') {
      lastBranch = 'origin/main';
    }

    for (const branch of reversedParentBranches) {
      await this.git.checkout(branch);
      await this.rebase(lastBranch);
      await this.push(pushOptions, 'current');
      lastBranch = branch;
    }

    this.logger.log('Sync Up successful');
  }

  public async syncDown(currentBranch: string): Promise<void> {
    try {
      const childBranches = await this.childrenHelper.getChildren(currentBranch);
    
      for (const branch of childBranches) {
        const { firstParent } = await this.getSyncBranchOrder(branch, false);
        await this.git.checkout(branch);
        await this.rebase(firstParent);
        await this.push('current', 'current');
      }

      this.logger.info('Sync down successful');
    } catch (error) {
      this.logger.error('Error syncing down', error);
      throw error;
    }
  }

  public async getPushOptions(): Promise<IPushOptions> {
    const answer: { action: IPushOptions } = await prompt({
      type: 'select',
      name: 'action',
      message: 'would you like to push the changes?',
      choices: [
        { name: 'current', message: 'Yes, the current branch only' },
        { name: 'current,all', message: 'Yes, all branches' },
        { name: '', message: 'no' },
      ]
    });

    return answer.action;
  }

  public async getSyncBranchOrder(currentBranch: string, full?: boolean)
    : Promise<{ firstParent: string, reversedParentBranches: string[] }> {
    const parent = await this.parentHelper.getParent(currentBranch);
    const parentBranches = (full) ? parent.parentBranches.filter(branch => branch !== 'main') : [];
    const reversedParentBranches = [currentBranch, ...parentBranches].reverse();
    return {
      firstParent: parent.firstParent,
      reversedParentBranches,
    };
  }

  public async applyStash(currentStash: string): Promise<void> {
    const stashList = await this.git.stashList();
    const stashIndex = stashList.all.findIndex(stash => stash.message.includes(currentStash));
    if (stashIndex === -1) {
      this.logger.log(`No stash ${currentStash} found`);
      return;
    }

    this.logger.log('Applying stash');
    const stashRef = `stash@{${stashIndex}}`;
    await this.git.stash(['apply', stashRef]);
    await this.checkStatus('stash');
  }

  public async createStash(currentBranch: string): Promise<string> {
    const stashName = `zgit-cli-${currentBranch}`;
    await this.git.stash(['save', '--include-untracked', stashName]);
    return stashName;
  }

}
