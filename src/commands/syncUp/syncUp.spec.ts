import simpleGit, { SimpleGit } from 'simple-git';
import { BranchHelper } from '../../helpers/BranchHelper';
import { ParentHelper } from '../../helpers/ParentHelper';
import { SyncUpCommand } from './syncUp';


const mockSimpleGit = {
  fetch: jest.fn(),
  checkout: jest.fn(),
  rebase: jest.fn(),
  stash: jest.fn(),
  raw: jest.fn(),
};
jest.mock('simple-git', () => jest.fn(() => mockSimpleGit));
jest.mock('../../helpers/ParentHelper');
jest.mock('../../helpers/BranchHelper');

describe('SyncUpCommand', () => {
  let syncUpCommand: SyncUpCommand;
  let gitMock: jest.Mocked<SimpleGit>;
  let parentHelperMock: jest.Mocked<ParentHelper>;
  let branchHelperMock: jest.Mocked<BranchHelper>;

  beforeEach(() => {
    gitMock = simpleGit() as jest.Mocked<SimpleGit>;
    parentHelperMock = new ParentHelper(gitMock) as jest.Mocked<ParentHelper>;
    branchHelperMock = new BranchHelper(gitMock) as jest.Mocked<BranchHelper>;
    syncUpCommand = new SyncUpCommand(gitMock, parentHelperMock, branchHelperMock);
  });

  it('should rebase the current branch and its parents with the latest changes', async () => {
    const parents = ['main', 'feature', 'feature-1'];
    branchHelperMock.getCurrentBranch.mockResolvedValue('feature-1-1');
    parentHelperMock.getParents.mockResolvedValue(parents);
    gitMock.fetch.mockResolvedValue({} as never);
    gitMock.checkout.mockResolvedValue({} as never);
    gitMock.rebase.mockResolvedValue({} as never);

    await syncUpCommand.execute();

    expect(gitMock.fetch).toHaveBeenCalledTimes(1);
    expect(gitMock.checkout).toHaveBeenCalledTimes(parents.length + 1);
    expect(gitMock.rebase).toHaveBeenCalledTimes(parents.length + 1);
    expect(gitMock.stash).toHaveBeenCalledTimes(1);
    expect(gitMock.raw).toHaveBeenCalledWith(['stash', 'apply']);
  });
});
