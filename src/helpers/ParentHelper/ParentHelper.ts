import { inject, injectable } from 'inversify';
import { SimpleGit } from 'simple-git';
import TYPES from '../../inversify/types';
import { PrefixHelper } from '../PrefixHelper/PrefixHelper';

export interface IParentHelper {
  getParents(currentBranch: string): Promise<string[]>;
  getParent(currentBranch: string): Promise<{ firstParent: string, parentBranches: string[] }>;
}
@injectable()
export class ParentHelper implements IParentHelper {

  constructor(
    @inject(TYPES.SimpleGit) private git: SimpleGit,
    @inject(TYPES.PrefixHelper) private prefixHelper: PrefixHelper,
  ) {}

  public async getParents(currentBranch: string) {
    const feature = this.prefixHelper.getTopLevelParentPrefix(currentBranch);
    const allBranches = await this.git.branchLocal();
    const result: Record<string, string> = {};
    allBranches.all
      .filter(branch => branch.startsWith(feature))
      .forEach(branch => result[this.prefixHelper.getPrefix(branch)] = branch);
  
    const parentBranches: string[] = [];
    let currentPrefix = this.prefixHelper.getParentPrefix(currentBranch);
      
    while (currentPrefix !== 'main') {
      const branch = result[currentPrefix];
      if (branch) {
        parentBranches.push(branch);
      }
      currentPrefix = this.prefixHelper.getParentPrefix(currentPrefix);
    }
      
    parentBranches.push('main');
      
    return parentBranches;
  }

  public async getParent(currentBranch: string) {
    const parentBranches = await this.getParents(currentBranch);
    const firstParent = parentBranches[0];
    return { firstParent, parentBranches };
  }
}