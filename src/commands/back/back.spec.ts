import simpleGit, { SimpleGit } from 'simple-git';
import { IBranchHelper, IChildrenHelper, ILoggerHelper, IParentHelper } from '../../helpers';
import { MockBranchHelper } from '../../helpers/BranchHelper/MockBranchHelper';
import { MockChildrenHelper } from '../../helpers/ChildrenHelper/MockChildrenHelper';
import { MockLoggerHelper } from '../../helpers/LoggerHelper/MockLoggerHelper';
import { MockParentHelper } from '../../helpers/ParentHelper/MockParentHelper';
import { BackCommand } from './back';

jest.mock('simple-git', () => jest.fn().mockImplementation(() => ({
  checkout: jest.fn().mockResolvedValue(null),
})));

describe('BackCommand', () => {
  let backCommand: BackCommand;
  let mockGit: jest.Mocked<SimpleGit>;
  let mockChildrenHelper: jest.Mocked<IChildrenHelper>;
  let mockParentHelper: jest.Mocked<IParentHelper>;
  let mockBranchHelper: jest.Mocked<IBranchHelper>;
  let mockLogger: jest.Mocked<ILoggerHelper>;
  
  beforeEach(() => {
    mockGit = simpleGit() as jest.Mocked<SimpleGit>;
    mockChildrenHelper = new MockChildrenHelper();
    mockParentHelper = new MockParentHelper();
    mockBranchHelper = new MockBranchHelper();
    mockLogger = new MockLoggerHelper();
    
    backCommand = new BackCommand(
      mockGit,
      mockChildrenHelper,
      mockParentHelper,
      mockBranchHelper,
      mockLogger,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should get help', async () => {
    const help = backCommand.help();
    expect(help).toContain('zgit-cli back');
  });

  it('should switch to the previous sibling branch if available', async () => {
    mockBranchHelper.getCurrentBranch.mockResolvedValue('feature/CPF-789-2-fix');
    mockParentHelper.getParent.mockResolvedValue({ firstParent: 'feature/CPF-789', parentBranches: []  });
    mockChildrenHelper.getChildren.mockResolvedValue([
      'feature/CPF-789-1-addition',
      'feature/CPF-789-2-fix',
      'feature/CPF-789-3-update'
    ]);

    await backCommand.execute();

    expect(mockGit.checkout).toHaveBeenCalledWith('feature/CPF-789-1-addition');
    expect(mockLogger.log).toHaveBeenCalledWith('Switched from feature/CPF-789-2-fix to feature/CPF-789-1-addition');
  });

  it('should log an error if there is no previous sibling branch', async () => {
    mockBranchHelper.getCurrentBranch.mockResolvedValue('feature/CPF-789-1-addition');
    mockParentHelper.getParent.mockResolvedValue({ firstParent: 'feature/CPF-789', parentBranches: []  });
    mockChildrenHelper.getChildren.mockResolvedValue([
      'feature/CPF-789-1-addition',
      'feature/CPF-789-2-fix'
    ]);

    await backCommand.execute();

    expect(mockGit.checkout).not.toHaveBeenCalled();
    expect(mockLogger.log).toHaveBeenCalledWith('No previous sibling branch found.');
  });

  it('should handle when current branch is the only child', async () => {
    mockBranchHelper.getCurrentBranch.mockResolvedValue('feature/CPF-789-1-addition');
    mockParentHelper.getParent.mockResolvedValue({ firstParent: 'feature/CPF-789', parentBranches: [] });
    mockChildrenHelper.getChildren.mockResolvedValue(['feature/CPF-789-1-addition']);

    await backCommand.execute();

    expect(mockGit.checkout).not.toHaveBeenCalled();
    expect(mockLogger.log).toHaveBeenCalledWith('No previous sibling branch found.');
  });

  it('should handle when no current branch is returned', async () => {
    mockBranchHelper.getCurrentBranch.mockResolvedValue(null as never);

    await backCommand.execute();

    expect(mockLogger.log).toHaveBeenCalledWith('No current branch found. Exiting.');
  });
});
