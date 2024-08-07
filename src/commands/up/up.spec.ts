import simpleGit, { SimpleGit } from 'simple-git';
import { MockBranchHelper } from '../../helpers/BranchHelper/MockBranchHelper';
import { MockParentHelper } from '../../helpers/ParentHelper/MockParentHelper';
import { UpCommand } from './up';

jest.mock('simple-git', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: jest.fn(),
  }));
});

describe('UpCommand', () => {
  let upCommand: UpCommand;
  let mockGit: jest.Mocked<SimpleGit>;
  let mockBranchHelper: MockBranchHelper;
  let mockParentHelper: MockParentHelper;

  beforeEach(() => {
    mockGit = simpleGit() as jest.Mocked<SimpleGit>;
    mockBranchHelper = new MockBranchHelper();
    mockParentHelper = new MockParentHelper();
    upCommand = new UpCommand(mockGit, mockBranchHelper, mockParentHelper);
    jest.clearAllMocks();
  });

  it('should get help', async () => {
    const help = upCommand.help();
    expect(help).toContain('zgit-cli up');
  });

  describe('execute', () => {
    it('should checkout the first parent branch if it exists', async () => {
      mockBranchHelper.getCurrentBranch.mockResolvedValueOnce('feature-1-1');
      mockParentHelper.getParent.mockResolvedValueOnce({ firstParent: 'feature-1' });
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      const checkoutSpy = jest.spyOn(mockGit, 'checkout').mockImplementation();
    
      await upCommand.execute();

      expect(checkoutSpy).toHaveBeenCalledWith('feature-1');
      expect(consoleSpy).toHaveBeenCalledWith('Switched to branch feature-1');
      consoleSpy.mockRestore();
      checkoutSpy.mockRestore();
    });

    it('should throw an error if no parent branches are found', async () => {
      mockParentHelper.getParent.mockResolvedValueOnce({ firstParent: null });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(upCommand.execute()).rejects.toThrow('No parent branches found.');
      expect(consoleErrorSpy).toHaveBeenCalledWith('UpCommand Error:', 'No parent branches found.');

      consoleErrorSpy.mockRestore();
    });
  });
});
