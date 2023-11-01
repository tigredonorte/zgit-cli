import simpleGit, { BranchSummary, SimpleGit } from 'simple-git';
import { ParentHelper } from './ParentHelper';

jest.mock('simple-git', () => {
  return jest.fn().mockImplementation(() => ({
    branchLocal: jest.fn(),
  }));
});

// class MockPrefixHelper implements IPrefixHelper {
//   getPrefix = jest.fn();
//   getParentPrefix = jest.fn();
// }

describe('ParentHelper', () => {
  const mainBranch = 'main';
  let parentHelper: ParentHelper;
  let mockGit: jest.Mocked<SimpleGit>;
  // let mockPrefixHelper: MockPrefixHelper;

  beforeEach(() => {
    mockGit = simpleGit() as jest.Mocked<SimpleGit>;
    // mockPrefixHelper = new MockPrefixHelper();
    parentHelper = new ParentHelper(mockGit);
  });

  describe('getParents', () => {
    it('should return an array of parent branches', async () => {
      const currentBranch = 'feature-1-1';
      const parentBranch = 'feature-1-some-feature';
      const auntBranch = 'feature-2';
      mockGit.branchLocal.mockResolvedValueOnce({
        all: [currentBranch, parentBranch, auntBranch, mainBranch],
      } as BranchSummary);

      const parents = await parentHelper.getParents(currentBranch);

      expect(parents).toEqual([parentBranch, mainBranch]);
      expect(parents).not.toContain(auntBranch);
    });
    it('should not return children feature-1-1', async () => {
      mockGit.branchLocal.mockResolvedValueOnce({
        all: ['feature-1-1', 'feature-1', 'feature', mainBranch],
      } as BranchSummary);

      const parents = await parentHelper.getParents('feature-1');

      expect(parents).not.toContain(['feature-1-1']);
    });
    it('should not return sibling: feature-1-2', async () => {
      const currentBranch = 'feature-1-1-test';
      const parentBranch = 'feature-1-some-feature';
      const siblingBranch = 'feature-1-2-another-test';
      mockGit.branchLocal.mockResolvedValueOnce({
        all: [currentBranch, siblingBranch, parentBranch, mainBranch],
      } as BranchSummary);

      const parents = await parentHelper.getParents(currentBranch);

      expect(parents).not.toContain(siblingBranch);
      expect(parents).toEqual([parentBranch, mainBranch]);
    });
  });

  describe('getParent', () => {
    it('should return the first parent branch', async () => {
      const currentBranch = 'feature-1-1-1-test';
      const parentBranch = 'feature-1-1-some-feature';
      const grandParentBranch = 'feature-1-some-feature';
      mockGit.branchLocal.mockResolvedValueOnce({
        all: [currentBranch, parentBranch, grandParentBranch, mainBranch],
      } as BranchSummary);

      const { firstParent, parentBranches } = await parentHelper.getParent(currentBranch);

      expect(firstParent).toEqual(parentBranch);
      expect(parentBranches).toEqual([parentBranch, grandParentBranch, mainBranch]);
    });
  });
});
