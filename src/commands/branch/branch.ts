import { prompt } from 'enquirer';
import simpleGit, { SimpleGit } from 'simple-git';
import { BranchHelper, ChildrenHelper, IBranchHelper, IChildrenHelper, IPrefixHelper, PrefixHelper } from '../../helpers';
import { ICommand } from '../ICommand';

export class BranchCommand implements ICommand {
  public constructor(
    private git: SimpleGit = simpleGit(),
    private logger = console,
    private branchHelper: IBranchHelper = new BranchHelper(git),
    private childrenHelper: IChildrenHelper = new ChildrenHelper(git),
    private prefixHelper: IPrefixHelper = new PrefixHelper(),
  ) { }

  public help(): string {
    return 'Usage: zgit branch\n' +
           'Handles feature branch creation and switching.';
  }

  public async execute(): Promise<void> {
    const currentBranch = await this.branchHelper.getCurrentBranch();
    const prefix = this.prefixHelper.getPrefix(currentBranch);
    const isFeatureBranch = /-\d+-$/.test(prefix);

    if (!isFeatureBranch) {
      return await this.switchFeatureBranch();
    }

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
      return await this.switchFeatureBranch();
    } 
    await this.askForSlugAndCreateBranch(prefix, currentBranch);
  }

  private async switchFeatureBranch(): Promise<void> {
    const { featureBranch } = await prompt<{ featureBranch: string }>({
      type: 'input',
      name: 'featureBranch',
      message: 'Which feature branch would you like to switch to?',
      validate: (value: string) => value ? true : 'A feature branch is required.',
    });

    if (featureBranch) {
      await this.git.checkout(featureBranch);
      console.log(`Switched to feature branch: ${featureBranch}`);
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
      const childNumber = children.length + 1;
      const newBranchName = `${prefix}${childNumber}-${slug.replace(/\s+/g, '-')}`;
      await this.git.checkoutBranch(newBranchName, parentBranch);
      console.log(`Created and switched to branch: ${newBranchName}`);
    }
  }
}
