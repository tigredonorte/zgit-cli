import simpleGit, { SimpleGit } from 'simple-git';
import { BranchHelper, ChildrenHelper, IBranchHelper, IChildrenHelper, IParentHelper, ParentHelper } from '../../helpers';
import { ICommand } from '../ICommand';

export class NextCommand implements ICommand {
  public constructor(
    private git: SimpleGit = simpleGit(),
    private childrenHelper: IChildrenHelper = new ChildrenHelper(git),
    private parentHelper: IParentHelper = new ParentHelper(git),
    private branchHelper: IBranchHelper = new BranchHelper(git),
    private logger = console,
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
