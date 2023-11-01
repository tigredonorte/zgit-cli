import simpleGit, { SimpleGit } from 'simple-git';
import { BranchHelper, IBranchHelper, IParentHelper, ParentHelper } from '../../helpers';
import { ICommand } from '../ICommand';

export class SyncUpCommand implements ICommand {

  public constructor(
    private git: SimpleGit = simpleGit(),
    private parentHelper: IParentHelper = new ParentHelper(git),
    private branchHelper: IBranchHelper = new BranchHelper(git),
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
