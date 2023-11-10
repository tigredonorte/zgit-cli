import { inject, injectable } from 'inversify';
import { SimpleGit } from 'simple-git';
import { Argv } from 'yargs';
import { IBranchHelper, IParentHelper } from '../../helpers';
import TYPES from '../../inversify/types';
import { ICommand } from '../ICommand';


@injectable()
export class UpCommand implements ICommand {

  public constructor(
    @inject(TYPES.SimpleGit) private git: SimpleGit,
    @inject(TYPES.BranchHelper) private branchHelper: IBranchHelper,
    @inject(TYPES.ParentHelper) private parentHelper: IParentHelper,
  ) {}

  help(): string {
    return 'Switches to the first sibling branch found in the list generated by \'git branch\'.';
  }

  public configure(yargs: Argv): Argv {
    return yargs;
  }
  async execute(): Promise<void> {
    try {
      const currentBranch = await this.branchHelper.getCurrentBranch();
      const { firstParent } = await this.parentHelper.getParent(currentBranch);

      if (!firstParent) {
        throw new Error('No parent branches found.');
      }

      if (firstParent === 'main') {
        throw new Error('No parent branches found.');
      }

      await this.git.checkout(firstParent);
      console.info(`Switched to branch ${firstParent}`);
    } catch (error) {
      console.error('UpCommand Error:', error instanceof Error ? error.message : error);
      throw error;
    }
  }
}