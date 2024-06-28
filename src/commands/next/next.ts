import { inject, injectable } from 'inversify';
import { SimpleGit } from 'simple-git';
import { Argv } from 'yargs';
import { IBranchHelper, IChildrenHelper, ILoggerHelper, IPrefixHelper } from '../../helpers';
import TYPES from '../../inversify/types';
import { ICommand } from '../ICommand';

@injectable()
export class NextCommand implements ICommand {
  public constructor(
    @inject(TYPES.SimpleGit) private git: SimpleGit,
    @inject(TYPES.ChildrenHelper) private childrenHelper: IChildrenHelper,
    @inject(TYPES.PrefixHelper) private prefixHelper: IPrefixHelper,
    @inject(TYPES.BranchHelper) private branchHelper: IBranchHelper,
    @inject(TYPES.LoggerHelper) private logger: ILoggerHelper,
  ) {}

  public help(): string {
    return 'Switches to the next sibling branch if available.';
  }

  public configure(yargs: Argv): Argv {
    return yargs;
  }

  public async execute(): Promise<void> {
    const currentBranch = await this.branchHelper.getCurrentBranch();
    if (!currentBranch) {
      this.logger.log('No current branch found. Exiting.');
      return;
    }
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
    const prefix = this.prefixHelper.getParentPrefix(currentBranch);
    const siblings = await this.childrenHelper.getChildren(prefix);
    return siblings;
  }
}
