import { prompt } from 'enquirer';
import { inject, injectable } from 'inversify';
import { SimpleGit } from 'simple-git';
import { Argv } from 'yargs';
import { IBranchHelper, IChildrenHelper, ILoggerHelper, IPrefixHelper } from '../../helpers';
import TYPES from '../../inversify/types';
import { ICommand } from '../ICommand';

@injectable()
export class BranchCommand implements ICommand {
  public constructor(
    @inject(TYPES.SimpleGit) private git: SimpleGit,
    @inject(TYPES.LoggerHelper) private logger: ILoggerHelper,
    @inject(TYPES.PrefixHelper) private prefixHelper: IPrefixHelper,
    @inject(TYPES.BranchHelper) private branchHelper: IBranchHelper,
    @inject(TYPES.ChildrenHelper) private childrenHelper: IChildrenHelper,
  ) { }

  public help(): string {
    return 'Handles feature branch creation and switching.';
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
    const prefix = this.prefixHelper.getPrefix(currentBranch);
    if (!prefix) {
      this.logger.log('No prefix found. Exiting.');
      return;
    }

    const isFeatureBranch = /-\d+-$/.test(prefix);
    if (isFeatureBranch) {
      return await this.isFeatureBranch(prefix, currentBranch);
    }
    return await this.switchFeatureBranch(currentBranch);
  }

  private async isFeatureBranch(prefix: string, currentBranch: string): Promise<void> {
    const { switchFeature } = await prompt<{ switchFeature: string }>({
      type: 'select',
      name: 'switchFeature',
      message: 'You are on a feature branch. What would you like to do?',
      choices: [
        { message: 'Stay on the current branch', name: 'stay' },
        { message: 'Switch to a different feature branch', name: 'switch' },
      ],
    });
    
    if (switchFeature === 'switch') {
      return await this.switchFeatureBranch(currentBranch);
    } 
    await this.askForSlugAndCreateBranch(prefix, currentBranch);
  }

  private async switchFeatureBranch(currentBranch: string): Promise<void> {
    const { featureBranch } = await prompt<{ featureBranch: string }>({
      type: 'input',
      name: 'featureBranch',
      message: 'Which feature branch would you like to switch to?',
      validate: (value: string) => value ? true : 'A feature branch is required.',
    });

    if (featureBranch) {
      await this.git.checkoutBranch(featureBranch, currentBranch);
      this.logger.log(`Switched to feature branch: ${featureBranch}`);
    }
  }

  private async askForSlugAndCreateBranch(prefix: string, parentBranch: string): Promise<void> {
    const { slug } = await prompt<{ slug: string }>({
      type: 'input',
      name: 'slug',
      message: 'Enter the slug for the new branch:',
      validate: (value: string) => value ? true : 'A slug is required.',
    });

    if (slug) {
      const children = await this.childrenHelper.getChildren(parentBranch);
      const childNumber = this.getNextChildrenNumber(children);
      const newBranchName = `${prefix}${childNumber}-${slug.replace(/\s+/g, '-')}`;
      await this.git.checkoutBranch(newBranchName, parentBranch);
      this.logger.log(`Created and switched to branch: ${newBranchName}`);
    }
  }

  private getNextChildrenNumber(children: string[]) {
    const result = children.map(branch => { 
      const segments = branch.split('-');
      const numberSegment = segments.map(segment => /\d/.test(segment));

      // Find the index where the first true appears in numberSegment array
      const firstTrueIndex = numberSegment.indexOf(true);
      if (firstTrueIndex === -1) {
        return 1;
      }

      const firstFalseAfterTrueIndex = numberSegment.indexOf(false, firstTrueIndex);
      return parseInt(segments[firstFalseAfterTrueIndex - 1]) + 1;
    }).sort();
    return result[result.length - 1] || 1;
  }
}
