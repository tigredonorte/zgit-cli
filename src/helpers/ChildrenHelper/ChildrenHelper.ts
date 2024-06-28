import { inject, injectable } from 'inversify';
import { SimpleGit } from 'simple-git';
import TYPES from '../../inversify/types';
import { PrefixHelper } from '../PrefixHelper/PrefixHelper';

export interface IChildrenHelper {
  getChildren(currentBranch: string): Promise<string[]>;
  sortArray(arr: string[]): string[];
}
@injectable()
export class ChildrenHelper implements IChildrenHelper {

  constructor(
    @inject(TYPES.SimpleGit) private git: SimpleGit,
    @inject(TYPES.PrefixHelper) private prefixHelper: PrefixHelper,
  ) {}

  public async getChildren(currentBranch: string): Promise<string[]> {
    const allBranches = await this.git.branchLocal();
    const currentPrefix = this.prefixHelper.getPrefix(currentBranch);
    const childBranches = allBranches.all.filter(branch => {
      const branchPrefix = this.prefixHelper.getPrefix(branch);
      return branchPrefix.startsWith(currentPrefix) && branchPrefix !== currentPrefix;
    });

    const sortedChildren = this.sortArray(childBranches);
    return sortedChildren;
  }

  public sortArray(arr: string[]) {
    return arr.sort((a, b) => {
      // Extracting the numeric parts of each string
      const numsA = a.split('-').filter(part => /^\d+$/.test(part)).map(Number);
      const numsB = b.split('-').filter(part => /^\d+$/.test(part)).map(Number);
  
      // Comparing the numeric sequences
      for (let i = 0; i < Math.min(numsA.length, numsB.length); i++) {
        if (numsA[i] !== numsB[i]) {
          return numsA[i] - numsB[i];
        }
      }
  
      // In case of a tie, the one with fewer numbers comes first
      return numsA.length - numsB.length;
    });
  }
  

}
