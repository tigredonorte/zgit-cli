import simpleGit, { SimpleGit } from 'simple-git';
import { MockBranchHelper } from '../../helpers/BranchHelper/MockBranchHelper';
import { MockParentHelper } from '../../helpers/ParentHelper/MockParentHelper';
import { SyncUpCommand } from './syncUp';

const mockSimpleGit = {
  fetch: jest.fn(),
  checkout: jest.fn(),
  rebase: jest.fn(),
  stash: jest.fn(),
  raw: jest.fn(),
};
jest.mock('simple-git', () => jest.fn(() => mockSimpleGit));

describe('SyncUpCommand', () => {
  let syncUpCommand: SyncUpCommand;
  let gitMock: jest.Mocked<SimpleGit>;
  let parentHelperMock: jest.Mocked<MockParentHelper>;
  let branchHelperMock: jest.Mocked<MockBranchHelper>;

  beforeEach(() => {
    gitMock = simpleGit() as jest.Mocked<SimpleGit>;
    parentHelperMock = new MockParentHelper();
    branchHelperMock = new MockBranchHelper();
    syncUpCommand = new SyncUpCommand(gitMock, parentHelperMock, branchHelperMock);
  });

  it('should get help', async () => {
    const help = syncUpCommand.help();
    expect(help).toContain('zgit-cli syncUp');
  });

  it('should rebase the current branch and its parents with the latest changes', async () => {
    const parents = ['main', 'feature', 'feature-1'];
    branchHelperMock.getCurrentBranch.mockResolvedValue('feature-1-1');
    parentHelperMock.getParents.mockResolvedValue(parents);
    gitMock.fetch.mockResolvedValue({} as never);
    gitMock.checkout.mockResolvedValue({} as never);
    gitMock.rebase.mockResolvedValue({} as never);
    gitMock.raw.mockResolvedValueOnce('any');

    await syncUpCommand.execute();

    expect(gitMock.fetch).toHaveBeenCalledTimes(1);
    expect(gitMock.checkout).toHaveBeenCalledTimes(parents.length + 1);
    expect(gitMock.rebase).toHaveBeenCalledTimes(parents.length + 1);
    expect(gitMock.stash).toHaveBeenCalledTimes(1);
    expect(gitMock.raw).toHaveBeenCalledWith(['stash', 'list']);
    expect(gitMock.raw).toHaveBeenCalledWith(['stash', 'apply']);
  });
});
