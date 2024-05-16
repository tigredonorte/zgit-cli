import { inject, injectable } from 'inversify';
import { SimpleGit } from 'simple-git';
import { Argv } from 'yargs';
import TYPES from '../../inversify/types';
import { ICommand } from '../ICommand';

@injectable()
export class CleanBranchesCommand implements ICommand {

  constructor(
    @inject(TYPES.SimpleGit) private git: SimpleGit
  ) {}

  public help(): string {
    return 'Fetches and prunes remote-tracking branches, then deletes local branches that have been pruned.';
  }

  public configure(yargs: Argv): Argv {
    return yargs;
  }

  public async execute(): Promise<void> {
    try {
      // Fetch and prune branches
      await this.git.fetch(['--prune']);
      
      // Get the list of all local branches
      const localBranches = await this.git.branchLocal();
      
      // Get the list of all remote-tracking branches
      const remoteBranches = await this.git.branch(['-r']);
      
      // Find branches to delete
      const branchesToDelete = localBranches.all.filter(branch => 
        !remoteBranches.all.some(remoteBranch => remoteBranch.endsWith(branch))
      );

      // Delete the branches
      for (const branch of branchesToDelete) {
        await this.git.branch(['-D', branch]);
        console.log(`Deleted branch: ${branch}`);
      }
    } catch (error) {
      console.error('Error cleaning branches:', error);
    }
  }
}
