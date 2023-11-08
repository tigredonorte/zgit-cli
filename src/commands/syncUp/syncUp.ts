import { inject } from 'inversify';
import { SimpleGit } from 'simple-git';
import { IBranchHelper, IParentHelper } from '../../helpers';
import TYPES from '../../inversify/types';
import { ICommand } from '../ICommand';

export class SyncUpCommand implements ICommand {

  public constructor(
    @inject(TYPES.SimpleGit) private git: SimpleGit,
    @inject(TYPES.ParentHelper) private parentHelper: IParentHelper,
    @inject(TYPES.BranchHelper) private branchHelper: IBranchHelper,
  ) {}

  public help(): string {
    return 'Usage: zgit-cli sync-up\n' +
           'Rebases the current branch and its parents with the latest changes from its parent branches.';
  }

  public async execute(): Promise<void> {
    try {
      const currentBranch = await this.branchHelper.getCurrentBranch();
      const parentBranches = await this.parentHelper.getParents(currentBranch);
      const reversedParentBranches = [...parentBranches, currentBranch];

      await this.git.stash(['save', '--include-untracked']);
      await this.git.fetch('origin/main');

      let lastBranch = 'origin/main';
      for (const branch of reversedParentBranches) {
        await this.git.checkout(branch);
        await this.git.rebase([lastBranch]);
        lastBranch = branch;
      }

      const stashList = await this.git.raw(['stash', 'list']);
      if (stashList) {
        await this.git.raw(['stash', 'apply']);
      }
    } catch (error) {
      await this.git.stash(['drop']);
      throw error;
    }
  }
}
