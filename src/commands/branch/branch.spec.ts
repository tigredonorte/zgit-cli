import { prompt } from 'enquirer';
import simpleGit, { SimpleGit } from 'simple-git';
import { IBranchHelper, IChildrenHelper, ILoggerHelper, IPrefixHelper } from '../../helpers';
import { MockBranchHelper } from '../../helpers/BranchHelper/MockBranchHelper';
import { MockChildrenHelper } from '../../helpers/ChildrenHelper/MockChildrenHelper';
import { MockPrefixHelper } from '../../helpers/PrefixHelper/MockPrefixHelper';
import { BranchCommand } from './branch';
import { MockLoggerHelper } from '../../helpers/LoggerHelper/MockLoggerHelper';

jest.mock('enquirer', () => ({
  prompt: jest.fn(),
}));
jest.mock('simple-git', () => jest.fn().mockImplementation(() => ({
  checkout: jest.fn().mockResolvedValue(null),
  checkoutBranch: jest.fn().mockResolvedValue(null),
})));

const mockPrompt = prompt as jest.MockedFunction<typeof prompt>;


describe('BranchCommand', () => {
  let branchCommand: BranchCommand;
  let mockGit: jest.Mocked<SimpleGit>;
  let branchHelperMock: jest.Mocked<IBranchHelper>;
  let childrenHelperMock: jest.Mocked<IChildrenHelper>;
  let mockPrefixHelper: jest.Mocked<IPrefixHelper>;
  let mockLogger: jest.Mocked<ILoggerHelper>;
  let promptMock: jest.Mock;
  
  beforeEach(() => {
    mockGit = simpleGit() as jest.Mocked<SimpleGit>;
    branchHelperMock = new MockBranchHelper();
    childrenHelperMock = new MockChildrenHelper();
    mockLogger = new MockLoggerHelper();
    promptMock = jest.fn();
    mockPrefixHelper = new MockPrefixHelper();
    (prompt as jest.MockedFunction<typeof prompt>).mockImplementation(promptMock);
    branchCommand = new BranchCommand(
      mockGit,
      mockLogger,
      mockPrefixHelper,
      branchHelperMock,
      childrenHelperMock,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sanityTests', () => {
    it('should exit if no branch is found', async () => {
      await branchCommand.execute();

      expect(mockLogger.log).toHaveBeenCalledWith('No current branch found. Exiting.');
    });

    it('should exit if no prefix is found', async () => {
      branchHelperMock.getCurrentBranch.mockResolvedValue('any-branch');
      await branchCommand.execute();

      expect(mockLogger.log).toHaveBeenCalledWith('No prefix found. Exiting.');
    });
  });


  describe('not feature branch', () => {
    const currentBranch = 'main';
    const currentSlug = 'main';
    beforeEach(() => {
      branchHelperMock.getCurrentBranch.mockResolvedValue(currentBranch);
      mockPrefixHelper.getPrefix.mockReturnValue(currentSlug as never);
    });
    it('should ask for a feature branch name and switch to it', async () => {
      const featureBranch = 'feature/new-feature';
      mockPrompt.mockResolvedValueOnce({ featureBranch });
    
      await branchCommand.execute();

      expect(mockPrompt).toHaveBeenCalledWith(expect.any(Object));
      expect(mockGit.checkoutBranch).toHaveBeenCalledWith(featureBranch, currentBranch);
    });
  });

  describe('isFeatureBranch, stay selected', () => {

    const currentBranch = 'CPF-123-test';
    const currentSlug = 'CPF-123-';
    beforeEach(() => {
      branchHelperMock.getCurrentBranch.mockResolvedValue(currentBranch);
      mockPrefixHelper.getPrefix.mockReturnValue(currentSlug as never);
      mockPrompt.mockResolvedValueOnce({ switchFeature: 'stay' });
    });

    it('should stay on the current branch if stay is selected and no slug is given', async () => {
      mockPrompt.mockResolvedValueOnce({ slug: undefined });

      await branchCommand.execute();

      expect(mockPrompt).toHaveBeenCalledTimes(2);
      expect(mockGit.checkoutBranch).not.toHaveBeenCalled();
    });


    it('should switch branch -1 when stay is selected, slug is given and there is no children', async () => {
      const slug = 'new-feature';
      const nextChildren = 1;
      mockPrompt.mockResolvedValueOnce({ slug });
      childrenHelperMock.getChildren.mockResolvedValue([]);

      await branchCommand.execute();

      expect(mockPrompt).toHaveBeenCalledTimes(2);
      expect(mockGit.checkoutBranch).toHaveBeenCalledWith(`${currentSlug}${nextChildren}-${slug}`, currentBranch);
    });

    it('should switch branch -3 when stay is selected, slug is given and there is children -2', async () => {
      const slug = 'new-feature';
      const nextChildren = 9;

      mockPrompt.mockResolvedValueOnce({ slug });
      childrenHelperMock.getChildren.mockResolvedValue(['CPF-123-2-more', 'CPF-123-8-another-children-9-zzz']);

      await branchCommand.execute();

      expect(mockPrompt).toHaveBeenCalledTimes(2);
      expect(mockGit.checkoutBranch).toHaveBeenCalledWith(`${currentSlug}${nextChildren}-${slug}`, currentBranch);
    });
  });

  describe('isFeatureBranch, switch selected', () => {

    const currentBranch = 'CPF-123-test';
    const currentSlug = 'CPF-123-';
    beforeEach(() => {
      branchHelperMock.getCurrentBranch.mockResolvedValue(currentBranch);
      mockPrefixHelper.getPrefix.mockReturnValue(currentSlug as never);
      mockPrompt.mockResolvedValueOnce({ switchFeature: 'switch' });
    });

    it('should switch to a different feature branch if selected', async () => {
      const featureBranch = 'CPF-456-feature';
      mockPrompt.mockResolvedValueOnce({ featureBranch });

      await branchCommand.execute();

      expect(mockPrompt).toHaveBeenCalledWith(expect.any(Object));
      expect(mockGit.checkoutBranch).toHaveBeenCalledWith(featureBranch, currentBranch);
    });

    it('should require a feature branch name if trying to switch', async () => {
      mockPrompt.mockResolvedValueOnce({ featureBranch: '' });

      await branchCommand.execute();

      expect(mockPrompt).toHaveBeenCalledWith(expect.any(Object));
      expect(mockGit.checkoutBranch).not.toHaveBeenCalled();
    });
  });
});
