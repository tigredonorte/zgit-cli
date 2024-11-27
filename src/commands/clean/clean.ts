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
    const branchesToDelete = await this.getBranchesToDelete();
    await this.deleteBranches(branchesToDelete);
  }

  private async getBranchesToDelete(): Promise<string[]> {
    try {
      // Fetch and prune branches
      await this.git.fetch(['--prune']);
      
      // Get the list of all local branches
      const localBranches = await this.git.branchLocal();
      
      const remoteBranches = await this.git.branch(['-r']);

      const currentBranch = (await this.git.revparse(['--abbrev-ref', 'HEAD'])).trim();

      const branchesToDelete = localBranches.all.filter(branch => 
        branch !== currentBranch &&
        !remoteBranches.all.some(remoteBranch => remoteBranch.endsWith(branch))
      );
      return branchesToDelete;
    } catch (error) {
      console.error('Error getting branches to delete:', error);
      return [];
    }
  }

  private async deleteBranches(branchesToDelete: string[]): Promise<void> {
    for (const branch of branchesToDelete) {
      try {
        await this.git.branch(['-D', branch]);
        console.log(`Deleted branch: ${branch}`);
      } catch (error) {
        console.error(`Error deleting branch ${branch}:`, error);
      }
    }
  }
}