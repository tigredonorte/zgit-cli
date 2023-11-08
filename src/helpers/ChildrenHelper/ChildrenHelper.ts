import { inject, injectable } from 'inversify';
import { SimpleGit } from 'simple-git';
import TYPES from '../../inversify/types';
import { PrefixHelper } from '../PrefixHelper/PrefixHelper';

export interface IChildrenHelper {
  getChildren(currentBranch: string): Promise<string[]>;
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
    return childBranches;
  }

}
