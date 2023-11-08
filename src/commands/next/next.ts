import { inject } from 'inversify';
import { SimpleGit } from 'simple-git';
import { IBranchHelper, IChildrenHelper, ILoggerHelper, IParentHelper } from '../../helpers';
import TYPES from '../../inversify/types';
import { ICommand } from '../ICommand';

export class NextCommand implements ICommand {
  public constructor(
    @inject(TYPES.SimpleGit) private git: SimpleGit,
    @inject(TYPES.ChildrenHelper) private childrenHelper: IChildrenHelper,
    @inject(TYPES.ParentHelper) private parentHelper: IParentHelper,
    @inject(TYPES.BranchHelper) private branchHelper: IBranchHelper,
    @inject(TYPES.LoggerHelper) private logger: ILoggerHelper,
  ) {}

  public help(): string {
    return 'Usage: zgit next\n' +
           'Switches to the next sibling branch if available.';
  }

  public async execute(): Promise<void> {
    const currentBranch = await this.branchHelper.getCurrentBranch();
    const siblings = await this.getSiblings(currentBranch);
    
    const currentIndex = siblings.findIndex((branch: string) => branch === currentBranch);
    const nextIndex = currentIndex + 1;

    if (nextIndex < siblings.length) {
      await this.checkout(siblings[nextIndex], currentBranch);
    } else {
      this.logger.log('No next sibling branch found.');
    }
  }

  private async checkout(targetBranch: string, currentBranch: string): Promise<void> {
    await this.git.checkout(targetBranch);
    this.logger.log(`Switched from ${currentBranch} to ${targetBranch}`);
  }

  private async getSiblings(currentBranch: string): Promise<string[]> {
    const parent = await this.parentHelper.getParent(currentBranch);
    const siblings = await this.childrenHelper.getChildren(parent.firstParent);
    return siblings;
  }
}
