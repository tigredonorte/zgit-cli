import simpleGit, { SimpleGit } from 'simple-git';
import { BranchHelper, ChildrenHelper, IBranchHelper, IChildrenHelper, IParentHelper, ParentHelper } from '../../helpers';
import { ICommand } from '../ICommand';

export class BackCommand implements ICommand {
  public constructor(
    private git: SimpleGit = simpleGit(),
    private childrenHelper: IChildrenHelper = new ChildrenHelper(git),
    private parentHelper: IParentHelper = new ParentHelper(git),
    private branchHelper: IBranchHelper = new BranchHelper(git),
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
      console.log('No previous sibling branch found.');
    }
  }

  private async checkout(targetBranch: string, currentBranch: string): Promise<void> {
    await this.git.checkout(targetBranch);
    console.log(`Switched from ${currentBranch} to ${targetBranch}`);
  }

  private async getSiblings(currentBranch: string): Promise<string[]> {
    const parent = await this.parentHelper.getParent(currentBranch);
    const siblings = await this.childrenHelper.getChildren(parent.firstParent);
    return siblings;
  }
}
