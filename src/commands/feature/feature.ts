import { prompt } from 'enquirer';
import { inject, injectable } from 'inversify';
import { SimpleGit } from 'simple-git';
import { Argv } from 'yargs';
import { IChildrenHelper, ILoggerHelper, IPrefixHelper } from '../../helpers';
import TYPES from '../../inversify/types';
import { ICommand } from '../ICommand';

@injectable()
export class FeatureCommand implements ICommand {
  public constructor(
    @inject(TYPES.SimpleGit) private git: SimpleGit,
    @inject(TYPES.PrefixHelper) private prefixHelper: IPrefixHelper,
    @inject(TYPES.LoggerHelper) private loggerHelper: ILoggerHelper,
    @inject(TYPES.ChildrenHelper) private childrenHelper: IChildrenHelper,
  ) {
  }

  public help(): string {
    return 'Lists feature branches and allows navigation through them.';
  }

  public configure(yargs: Argv): Argv {
    return yargs;
  }

  public async execute(): Promise<void> {
    const allBranches = await this.git.branchLocal();
    const featureBranches = this.getFeatureBranches(allBranches.all);

    const { group } = await prompt<{ group: string }>({
      type: 'select',
      name: 'group',
      message: 'Select a feature group:',
      choices: featureBranches
    });

    const branches = this.getSortedChildren(group, allBranches.all);
    const targetBranch = await this.getTargetBranch(branches);
    await this.checkoutBranch(targetBranch);
  }

  private getFeatureBranches(allBranches: string[]): string[] {
    const featureBranches = allBranches
      .filter((branch) => !branch.includes('remotes/'))
      .map( (branch) => this.prefixHelper.getTopLevelParentPrefix(branch))
      .reduce((acc, branch) => {
        if (!acc.includes(branch)) {
          acc.push(branch);
        }
        return acc;
      }, [] as string[])
      .filter((branch) => !!branch);
    return featureBranches;
  }

  private async checkoutBranch(branch: string): Promise<void> {
    await this.git.checkout(branch);
    this.loggerHelper.log(`Switched to branch: ${branch}`);
  }

  private getSortedChildren(group: string, allBranches: string[]): string[] {
    const unsortedBranches = allBranches
      .filter((branch) => branch.startsWith(group));
    const branches = this.childrenHelper.sortArray(unsortedBranches);
    return branches;
  }

  private async getTargetBranch(branches: string[]): Promise<string> {
    if (branches.length === 1) {
      return branches[0];
    }

    if (branches.length === 0) {
      throw new Error('No branches found.');
    }

    const { branch } = await prompt<{ branch: string }>({
      type: 'select',
      name: 'branch',
      message: 'Select a branch:',
      choices: branches
    });
    return branch;
  }
}