import simpleGit, { SimpleGit } from 'simple-git';
import { IPrefixHelper, PrefixHelper } from './PrefixHelper';

export interface IChildrenHelper {
  getChildren(currentBranch: string): Promise<string[]>;
}

export class ChildrenHelper implements IChildrenHelper {

  constructor(
    private git: SimpleGit = simpleGit(),
    private prefixHelper: IPrefixHelper = new PrefixHelper(),
  ) {}

  public async getChildren(currentBranch: string): Promise<string[]> {
    const allBranches = await this.git.branchLocal();
    const currentPrefix = this.prefixHelper.getPrefix(currentBranch);
    const childBranches = allBranches.all.filter(branch => {
      const branchPrefix = this.prefixHelper.getPrefix(branch);
      return branchPrefix.startsWith(currentPrefix) && branchPrefix !== currentPrefix;
    });
    return childBranches;
  }
}
