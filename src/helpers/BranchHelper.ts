import simpleGit, { SimpleGit } from 'simple-git';

export interface IBranchHelper {
  getCurrentBranch(): Promise<string>;
}


export class BranchHelper implements IBranchHelper {

  constructor(private git: SimpleGit = simpleGit()) {}

  public async getCurrentBranch(): Promise<string> {
    const { current } = await this.git.branch();
    return current;
  }
}