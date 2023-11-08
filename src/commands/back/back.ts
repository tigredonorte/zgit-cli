import { inject } from 'inversify';
import { SimpleGit } from 'simple-git';
import { IBranchHelper, IChildrenHelper, ILoggerHelper, IParentHelper } from '../../helpers';
import TYPES from '../../inversify/types';
import { ICommand } from '../ICommand';

export class BackCommand implements ICommand {
  public constructor(
    @inject(TYPES.SimpleGit) private git: SimpleGit,
    @inject(TYPES.ChildrenHelper) private childrenHelper: IChildrenHelper,
    @inject(TYPES.ParentHelper) private parentHelper: IParentHelper,
    @inject(TYPES.BranchHelper) private branchHelper: IBranchHelper,
    @inject(TYPES.LoggerHelper) private logger: ILoggerHelper,
  ) {}

  public help(): string {
    return 'Usage: zgit back\n' +
           'Switches to the previous sibling branch if available.';
  }

  public async execute(): Promise<void> {
    const currentBranch = await this.branchHelper.getCurrentBranch();
    const siblings = await this.getSiblings(currentBranch);
    
    const currentIndex = siblings.findIndex((branch: string) => branch === currentBranch);
    const backIndex = currentIndex - 1;

    if (backIndex >= 0) {
      await this.checkout(siblings[backIndex], currentBranch);
    } else {
      this.logger.log('No previous sibling branch found.');
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
