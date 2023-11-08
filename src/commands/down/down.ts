import { prompt } from 'enquirer';
import { inject, injectable } from 'inversify';
import { SimpleGit } from 'simple-git';
import { IBranchHelper, IChildrenHelper } from '../../helpers';
import TYPES from '../../inversify/types';
import { ICommand } from '../ICommand';

@injectable()
export class DownCommand implements ICommand {

  public constructor(
    @inject(TYPES.SimpleGit) private git: SimpleGit,
    @inject(TYPES.ChildrenHelper) private childrenHelper: IChildrenHelper,
    @inject(TYPES.BranchHelper) private branchHelper: IBranchHelper,
  ) {}

  public help(): string {
    return 'Usage: zgit-cli down\n' +
           'Switches to the child branch if there is only one, or prompts for which child branch to switch to if there are multiple.';
  }

  public async execute(): Promise<void> {
    const currentBranch = await this.branchHelper.getCurrentBranch();
    const childBranches = await this.childrenHelper.getChildren(currentBranch);

    if (!childBranches?.length) {
      console.error('No child branches found.');
      return;
    }
    if (childBranches.length === 1) {
      await this.checkout(childBranches[0], currentBranch);
      return;
    } 

    const { selectedBranch } = await prompt<{ selectedBranch: string }>({
      type: 'select',
      name: 'selectedBranch',
      message: 'Select a branch:',
      choices: childBranches,
    });

    console.log(`Selected branch: ${selectedBranch}`);
    if (selectedBranch) {
      await this.checkout(selectedBranch, currentBranch);
      return;
    }
    
    console.error('Invalid branch selected.');
  }

  private async checkout(targetBranch: string, currentBranch: string): Promise<void> {
    await this.git.checkout(targetBranch);
    console.log(`Switched from ${currentBranch} to ${targetBranch}`);
  }
}
