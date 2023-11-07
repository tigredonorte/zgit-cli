import simpleGit, { SimpleGit } from 'simple-git';
import { DownCommand } from './down';
import { BranchHelper, ChildrenHelper } from '../../helpers';
import { prompt } from 'enquirer';

const mockSimpleGit = {
  checkout: jest.fn(),
};
jest.mock('simple-git', () => jest.fn(() => mockSimpleGit));
jest.mock('../../helpers/BranchHelper');
jest.mock('../../helpers/ChildrenHelper');
jest.mock('enquirer', () => ({
  prompt: jest.fn(),
}));

describe('DownCommand', () => {
  let downCommand: DownCommand;
  let gitMock: jest.Mocked<SimpleGit>;
  let branchHelperMock: jest.Mocked<BranchHelper>;
  let childrenHelperMock: jest.Mocked<ChildrenHelper>;
  let promptMock: jest.Mock;

  beforeEach(() => {
    gitMock = simpleGit() as jest.Mocked<SimpleGit>;
    branchHelperMock = new BranchHelper(gitMock) as jest.Mocked<BranchHelper>;
    childrenHelperMock = new ChildrenHelper(gitMock) as jest.Mocked<ChildrenHelper>;
    downCommand = new DownCommand(gitMock, childrenHelperMock, branchHelperMock);
    promptMock = jest.fn();
    (prompt as jest.MockedFunction<typeof prompt>).mockImplementation(promptMock);
  });

  it('should handle no child branches', async () => {
    branchHelperMock.getCurrentBranch.mockResolvedValue('currentBranch');
    childrenHelperMock.getChildren.mockResolvedValue([]);

    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation();

    await downCommand.execute();

    expect(consoleErrorMock).toHaveBeenCalledWith('No child branches found.');

    consoleErrorMock.mockRestore();
  });

  it('should handle a single child branch', async () => {
    branchHelperMock.getCurrentBranch.mockResolvedValue('currentBranch');
    childrenHelperMock.getChildren.mockResolvedValue(['childBranch']);
    gitMock.checkout.mockResolvedValue({} as never);

    const consoleLogMock = jest.spyOn(console, 'log').mockImplementation();

    await downCommand.execute();

    expect(gitMock.checkout).toHaveBeenCalledWith('childBranch');
    expect(consoleLogMock).toHaveBeenCalledWith('Switched from currentBranch to childBranch');

    consoleLogMock.mockRestore();
  });

  it('should prompt user when multiple child branches exist', async () => {
    branchHelperMock.getCurrentBranch.mockResolvedValue('currentBranch');
    childrenHelperMock.getChildren.mockResolvedValue(['childBranch1', 'childBranch2']);
    promptMock.mockResolvedValue({ selectedBranch: 'childBranch1' });
    gitMock.checkout.mockResolvedValue({} as never);

    const consoleLogMock = jest.spyOn(console, 'log').mockImplementation();

    await downCommand.execute();

    expect(prompt).toHaveBeenCalledWith({
      type: 'select',
      name: 'selectedBranch',
      message: 'Select a branch:',
      choices: ['childBranch1', 'childBranch2'],
    });
    expect(gitMock.checkout).toHaveBeenCalledWith('childBranch1');
    expect(consoleLogMock).toHaveBeenCalledWith('Switched from currentBranch to childBranch1');

    consoleLogMock.mockRestore();
  });
});