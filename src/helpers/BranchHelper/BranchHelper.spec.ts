import simpleGit, { BranchSummary, SimpleGit } from 'simple-git';
import { BranchHelper } from './BranchHelper';

jest.mock('simple-git', () => {
  const mockBranch = jest.fn();
  return jest.fn().mockImplementation(() => {
    return { branch: mockBranch };
  });
});


describe('BranchHelper', () => {
  let mockGit: jest.Mocked<SimpleGit>;
  let branchHelper: BranchHelper;

  beforeEach(() => {
    // Reset the mocked simpleGit instance before each test
    mockGit = simpleGit() as jest.Mocked<SimpleGit>;
    branchHelper = new BranchHelper(mockGit);
  });

  describe('getCurrentBranch', () => {
    it('should return the current branch name', async () => {
      const mockBranchSummary: BranchSummary = {
        detached: true,
        current: 'main',
        all: ['main', 'dev'],
        branches: {}
      };
      mockGit.branch.mockResolvedValueOnce(mockBranchSummary);

      const currentBranch = await branchHelper.getCurrentBranch();

      expect(currentBranch).toBe('main');
      expect(mockGit.branch).toHaveBeenCalled();
    });

    it('should throw an error if simple-git fails', async () => {
      mockGit.branch.mockRejectedValueOnce(new Error('git branch failed'));

      await expect(branchHelper.getCurrentBranch()).rejects.toThrow('git branch failed');
      expect(mockGit.branch).toHaveBeenCalled();
    });
  });
});
