import { inject, injectable } from 'inversify';
import { SimpleGit } from 'simple-git';
import { Argv } from 'yargs';
import { IBranchHelper, IChildrenHelper, ILoggerHelper, IPrefixHelper } from '../../helpers';
import TYPES from '../../inversify/types';
import { ICommand } from '../ICommand';

@injectable()
export class BackCommand implements ICommand {
  public constructor(
    @inject(TYPES.SimpleGit) private git: SimpleGit,
    @inject(TYPES.ChildrenHelper) private childrenHelper: IChildrenHelper,
    @inject(TYPES.BranchHelper) private branchHelper: IBranchHelper,
    @inject(TYPES.LoggerHelper) private logger: ILoggerHelper,
    @inject(TYPES.PrefixHelper) private prefixHelper: IPrefixHelper,
  ) {}

  public help(): string {
    return 'Switches to the previous sibling branch if available.';
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
    const prefix = this.prefixHelper.getParentPrefix(currentBranch);
    const siblings = await this.childrenHelper.getChildren(prefix);
    return siblings;
  }
}
