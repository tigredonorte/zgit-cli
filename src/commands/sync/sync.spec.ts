import * as enquirer from 'enquirer';
import { SimpleGit } from 'simple-git';
import { Argv } from 'yargs';
import { MockBranchHelper } from '../../helpers/BranchHelper/MockBranchHelper';
import { MockLoggerHelper } from '../../helpers/LoggerHelper/MockLoggerHelper';
import { MockParentHelper } from '../../helpers/ParentHelper/MockParentHelper';
import { SyncCommand, SyncOptions } from './sync';

jest.mock('enquirer', () => ({
  prompt: jest.fn(),
}));

describe('SyncCommand', () => {
  let syncCommand: SyncCommand;
  let parentHelperMock: jest.Mocked<MockParentHelper>;
  let branchHelperMock: jest.Mocked<MockBranchHelper>;
  let loggerHelperMock: jest.Mocked<MockLoggerHelper>;
  let mockPrompt: jest.MockedFunction<typeof enquirer.prompt>;
  let mockSimpleGit: jest.Mocked<{
    status: jest.MockedFunction<SimpleGit['status']>,
    rebase: jest.MockedFunction<SimpleGit['rebase']>,
    push: jest.MockedFunction<SimpleGit['push']>,
    stash: jest.MockedFunction<SimpleGit['stash']>,
    fetch: jest.MockedFunction<SimpleGit['fetch']>,
    checkout: jest.MockedFunction<SimpleGit['checkout']>,
    stashList: jest.MockedFunction<SimpleGit['stashList']>,
  }>;

  beforeEach(() => {
    jest.restoreAllMocks();
    mockSimpleGit = { 
      status: jest.fn(), 
      rebase: jest.fn(),
      push: jest.fn(),
      stash: jest.fn(), 
      fetch: jest.fn(),
      checkout: jest.fn(),
      stashList: jest.fn(),
    };
    parentHelperMock = new MockParentHelper();
    branchHelperMock = new MockBranchHelper();
    branchHelperMock = new MockBranchHelper();
    loggerHelperMock = new MockLoggerHelper();
    mockPrompt = (enquirer.prompt as jest.Mock);
    syncCommand = new SyncCommand(
      mockSimpleGit as unknown as SimpleGit,
      parentHelperMock,
      branchHelperMock,
      loggerHelperMock
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should get help', async () => {
    const help = syncCommand.help();
    expect(help).toEqual('Rebases the parent branches on top of the current branch');
  });

  describe('configure method', () => {
    let mockYargs: jest.Mocked<Argv<SyncOptions>>;
    beforeEach(() => {
      mockYargs = {
        positional: jest.fn().mockReturnThis(),
      } as unknown as jest.Mocked<Argv<SyncOptions>>;
    });

    it('should correctly configure yargs', () => {
      syncCommand.configure(mockYargs);

      expect(mockYargs.positional).toHaveBeenCalledWith('target', expect.objectContaining({
        describe: 'target branch to rebase on top of',
        type: 'string',
        required: false,
      }));

      expect(mockYargs.positional).toHaveBeenCalledWith('down', expect.objectContaining({
        describe: 'should sync up or down. Defaults to up',
        type: 'boolean',
        required: true,
        default: false,
      }));

      expect(mockYargs.positional).toHaveBeenCalledWith('full', expect.objectContaining({
        describe: 'should sync all parents (if is up) or all children (if is down). Defaults to false (only syncs the first parent/child)',
        type: 'boolean',
        required: true,
        default: false,
      }));
    });
  });

  describe('checkStatus', () => {
    it('should log success when there are no conflicts', async () => {
      mockSimpleGit.status.mockResolvedValue({ conflicted: [] } as never);
  
      await syncCommand.checkStatus('test');
  
      expect(loggerHelperMock.log).toHaveBeenCalledWith('test finished successfully');
      expect(mockPrompt).not.toHaveBeenCalled();
    });
  
    it('should prompt and abort on conflict if user chooses to abort', async () => {
      mockSimpleGit.status.mockResolvedValue({ conflicted: ['file1', 'file2'] } as never);
      mockPrompt.mockResolvedValue({ action: 'Abort' } as never) ;
  
      await expect(syncCommand.checkStatus('test')).rejects.toThrow();
      expect(mockPrompt).toHaveBeenCalledTimes(1);
    });
  
  
    it('should recursively call checkStatus on conflict if user chooses to solve', async () => {
      mockSimpleGit.status
        .mockResolvedValueOnce({ conflicted: ['file1'] } as never)
        .mockResolvedValue({ conflicted: [] } as never);
      mockPrompt.mockResolvedValue({ action: 'Solve' } as never);
  
      await syncCommand.checkStatus('test');
  
      expect(mockPrompt).toHaveBeenCalled();
      expect(loggerHelperMock.log).toHaveBeenCalledWith('test finished successfully');
      expect(mockSimpleGit.status).toHaveBeenCalledTimes(2);
    });
  });

  describe('push method', () => {
    it('should skip push when pushOptions does not include currentOption', async () => {
      await syncCommand.push('someOptions', 'current');

      expect(loggerHelperMock.info).toHaveBeenCalledWith('skip push');
      expect(mockSimpleGit.push).not.toHaveBeenCalled();
    });

    it('should execute push when pushOptions include currentOption', async () => {
      mockSimpleGit.push.mockResolvedValue({
        remoteMessages: { all: ['Message1', 'Message2'] }
      } as never);

      await syncCommand.push('current', 'current');

      expect(mockSimpleGit.push).toHaveBeenCalledWith('origin', 'HEAD', ['--force']);
      expect(loggerHelperMock.info).toHaveBeenCalledWith('Pushed to origin HEAD with force. \n', 'Message1\nMessage2');
    });
  });
  describe('getPushOptions', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    it('should return "current" when the user chooses to push the current branch only', async () => {
      mockPrompt.mockResolvedValue({ action: 'current' });
  
      const result = await syncCommand.getPushOptions();
  
      expect(result).toEqual('current');
      expect(mockPrompt).toHaveBeenCalledWith(expect.objectContaining({
        type: 'select',
        name: 'action',
        message: 'would you like to push the changes?',
      }));
    });
  
    it('should return "current,all" when the user chooses to push all branches', async () => {
      mockPrompt.mockResolvedValue({ action: 'current,all' });
  
      const result = await syncCommand.getPushOptions();
  
      expect(result).toEqual('current,all');
    });
  
    it('should return an empty string when the user chooses not to push', async () => {
      mockPrompt.mockResolvedValue({ action: '' });
  
      const result = await syncCommand.getPushOptions();
  
      expect(result).toEqual('');
    });
  });
  
  describe('execute method', () => {
    beforeEach(() => {
      jest.spyOn(syncCommand, 'rebase').mockResolvedValue();
      jest.spyOn(syncCommand, 'syncUp').mockResolvedValue();
      jest.spyOn(syncCommand, 'syncDown').mockResolvedValue();
      jest.spyOn(syncCommand, 'push').mockResolvedValue();
      jest.spyOn(syncCommand, 'getPushOptions').mockResolvedValue('all');
    });
  
    it('should call rebase if target is provided', async () => {
      await syncCommand.execute({ target: 'feature-branch', down: false, full: false } as never);
  
      expect(syncCommand.rebase).toHaveBeenCalledWith('feature-branch');
      expect(syncCommand.syncUp).not.toHaveBeenCalled();
      expect(syncCommand.syncDown).not.toHaveBeenCalled();
      expect(syncCommand.push).toHaveBeenCalledWith('pushOptions', 'current');
    });
  
    it('should call syncUp if down is false', async () => {
      await syncCommand.execute({ down: false, full: true } as never);
  
      expect(syncCommand.syncUp).toHaveBeenCalledWith(true, 'pushOptions');
      expect(syncCommand.rebase).not.toHaveBeenCalled();
      expect(syncCommand.syncDown).not.toHaveBeenCalled();
      expect(syncCommand.push).toHaveBeenCalledWith('pushOptions', 'current');
    });
  
    it('should call syncDown if down is true', async () => {
      await syncCommand.execute({ down: true, full: false } as never);
  
      expect(syncCommand.syncDown).toHaveBeenCalledWith(false, 'pushOptions');
      expect(syncCommand.rebase).not.toHaveBeenCalled();
      expect(syncCommand.syncUp).not.toHaveBeenCalled();
      expect(syncCommand.push).toHaveBeenCalledWith('pushOptions', 'current');
    });
  });

  describe.only('syncUp method', () => {

    const parentResponse = { parentBranches: ['branch', 'branch-1', 'branch-1-1'], firstParent: 'branch' };
    const currentBranch = 'branch-1-1-1';
    const stashMessage = `zgit-cli-${currentBranch}`;
    const stashList = [{ message: 'stash message 2' }, { message: stashMessage }];
    beforeEach(() => {
      branchHelperMock.getCurrentBranch.mockResolvedValue(currentBranch);
      parentHelperMock.getParent.mockResolvedValue(parentResponse);
    });

    it('should handle full sync up correctly', async () => {
      mockSimpleGit.status.mockResolvedValue({ conflicted: [] } as never);
      mockSimpleGit.push.mockResolvedValue({ remoteMessages: { all: ['remote message'] } } as never);
      mockSimpleGit.stashList.mockResolvedValue({ all: stashList } as never);
      const rebaseSpy = jest.spyOn(syncCommand, 'rebase').mockResolvedValue();
      const pushSpy = jest.spyOn(syncCommand, 'push').mockResolvedValue();
      const callTimes = parentResponse.parentBranches.length + 1;
      const pushOptions = 'current';
  
      await syncCommand.syncUp(true, pushOptions);
  
      const temp = parentResponse.parentBranches.map((branch) => [branch]);
      const index = stashList.findIndex(stash => stash.message.includes(stashMessage));
      expect(mockSimpleGit.stash).toHaveBeenCalledWith(['save', '--include-untracked', stashMessage]);
      expect(mockSimpleGit.stash).toHaveBeenCalledWith(['apply', `stash@{${index}}`]);
      expect(mockSimpleGit.fetch).toHaveBeenCalledWith('origin/main');
      expect(mockSimpleGit.checkout).toHaveBeenCalledTimes(callTimes);
      expect(mockSimpleGit.rebase).not.toHaveBeenCalledWith([currentBranch]);
      expect(rebaseSpy.mock.calls.length).toBe(callTimes);
      expect(rebaseSpy.mock.calls).toEqual([['origin/main'], ...temp]);
      expect(pushSpy.mock.calls.length).toBe(callTimes);
      expect(pushSpy.mock.calls).toEqual([[pushOptions, 'current'], [pushOptions, 'current'], [pushOptions, 'current'], [pushOptions, 'current']]);
    });
  });
});
