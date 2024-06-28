import simpleGit, { SimpleGit } from 'simple-git';
import { IBranchHelper, IChildrenHelper, ILoggerHelper, IPrefixHelper } from '../../helpers';
import { MockBranchHelper } from '../../helpers/BranchHelper/MockBranchHelper';
import { MockChildrenHelper } from '../../helpers/ChildrenHelper/MockChildrenHelper';
import { MockLoggerHelper } from '../../helpers/LoggerHelper/MockLoggerHelper';
import { MockPrefixHelper } from '../../helpers/PrefixHelper/MockPrefixHelper';
import { NextCommand } from './next';

jest.mock('simple-git', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: jest.fn().mockResolvedValue(null),
  }));
});
describe('NextCommand', () => {
  let nextCommand: NextCommand;
  let mockGit: jest.Mocked<SimpleGit>;
  let mockChildrenHelper: jest.Mocked<IChildrenHelper>;
  let mockPrefixHelper: jest.Mocked<IPrefixHelper>;
  let mockBranchHelper: jest.Mocked<IBranchHelper>;
  let mockLogger: jest.Mocked<ILoggerHelper>;

  beforeEach(() => {
    mockGit = simpleGit() as jest.Mocked<SimpleGit>;
    mockChildrenHelper = new MockChildrenHelper();
    mockPrefixHelper = new MockPrefixHelper();
    mockBranchHelper = new MockBranchHelper();
    mockLogger = new MockLoggerHelper();

    nextCommand = new NextCommand(
      mockGit,
      mockChildrenHelper,
      mockPrefixHelper,
      mockBranchHelper,
      mockLogger,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should get help', async () => {
    const help = nextCommand.help();
    expect(help).toContain('zgit-cli next');
  });

  it('should switch to the next sibling branch if available', async () => {
    mockBranchHelper.getCurrentBranch.mockResolvedValue('feature/CPF-789-1-addition');
    mockPrefixHelper.getParentPrefix.mockReturnValue('feature/CPF-789');
    mockChildrenHelper.getChildren.mockResolvedValue([
      'feature/CPF-789-1-addition',
      'feature/CPF-789-2-fix',
      'feature/CPF-789-3-update'
    ]);

    await nextCommand.execute();

    expect(mockGit.checkout).toHaveBeenCalledWith('feature/CPF-789-2-fix');
    expect(mockLogger.log).toHaveBeenCalledWith('Switched from feature/CPF-789-1-addition to feature/CPF-789-2-fix');
  });

  it('should log an error if there is no next sibling branch', async () => {
    mockBranchHelper.getCurrentBranch.mockResolvedValue('feature/CPF-789-3-update');
    mockPrefixHelper.getParentPrefix.mockReturnValue('feature/CPF-789');
    mockChildrenHelper.getChildren.mockResolvedValue([
      'feature/CPF-789-1-addition',
      'feature/CPF-789-2-fix',
      'feature/CPF-789-3-update'
    ]);

    await nextCommand.execute();

    expect(mockGit.checkout).not.toHaveBeenCalled();
    expect(mockLogger.log).toHaveBeenCalledWith('No next sibling branch found.');
  });

  it('should handle when current branch is the last child', async () => {
    mockBranchHelper.getCurrentBranch.mockResolvedValue('feature/CPF-789-3-update');
    mockPrefixHelper.getParentPrefix.mockReturnValue('feature/CPF-789');
    mockChildrenHelper.getChildren.mockResolvedValue(['feature/CPF-789-3-update']);

    await nextCommand.execute();

    expect(mockGit.checkout).not.toHaveBeenCalled();
    expect(mockLogger.log).toHaveBeenCalledWith('No next sibling branch found.');
  });

  it('should handle when no current branch is returned', async () => {
    mockBranchHelper.getCurrentBranch.mockResolvedValue(null as never);

    await nextCommand.execute();

    expect(mockLogger.log).toHaveBeenCalledWith('No current branch found. Exiting.');
  });

});
