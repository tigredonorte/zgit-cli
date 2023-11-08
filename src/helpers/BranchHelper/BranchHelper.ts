import { inject, injectable } from 'inversify';
import { SimpleGit } from 'simple-git';
import TYPES from '../../inversify/types';

export interface IBranchHelper {
  getCurrentBranch(): Promise<string>;
}
@injectable()
export class BranchHelper implements IBranchHelper {

  constructor(
    @inject(TYPES.SimpleGit) private git: SimpleGit,
  ) {}

  public async getCurrentBranch(): Promise<string> {
    const { current } = await this.git.branch();
    return current;
  }
}