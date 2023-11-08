import { prompt } from 'enquirer';
import simpleGit, { SimpleGit } from 'simple-git';
import { MockLoggerHelper } from '../../helpers/LoggerHelper/MockLoggerHelper';
import { CommitCommand } from './commit';

const mockSimpleGit = {
  revparse: jest.fn(),
  add: jest.fn(),
  commit: jest.fn(),
  push: jest.fn(),
  diff: jest.fn(),
};
jest.mock('simple-git', () => jest.fn(() => mockSimpleGit));
jest.mock('enquirer', () => ({
  prompt: jest.fn(),
}));


describe('CommitCommand', () => {
  let commitCommand: CommitCommand;
  let mockGit: jest.Mocked<SimpleGit>;
  let mockPrompt: jest.Mock;
  let mockLogger: jest.Mocked<MockLoggerHelper>;

  beforeEach(() => {
    mockGit = simpleGit() as jest.Mocked<SimpleGit>;
    mockLogger = new MockLoggerHelper();
    commitCommand = new CommitCommand(mockGit, mockLogger);
    mockPrompt = jest.fn();
    (prompt as jest.MockedFunction<typeof prompt>).mockImplementation(mockPrompt);
    mockGit.revparse.mockResolvedValueOnce('GIT-123');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Help command', () => {
    it('should return the correct help message', () => {
      const helpMessage = commitCommand.help();
      expect(helpMessage).toContain('Usage: zgit commit [commit message]');
    });
  });

  describe('when there is not staged changes', () => {
    beforeEach(() => {
      mockGit.diff.mockResolvedValueOnce('');
    });
    it('should not perform a commit', async () => {
      mockPrompt
        .mockResolvedValueOnce({ action: 'cancel' })
        .mockResolvedValueOnce({ action: 'cancel' });

      await commitCommand.execute();

      expect(mockGit.commit).not.toHaveBeenCalled();
      expect(mockGit.push).not.toHaveBeenCalled();
    });
    it('should run git add -A', async () => {
      mockPrompt
        .mockResolvedValueOnce({ action: 'add' })
        .mockResolvedValueOnce({ action: 'add' });

      await commitCommand.execute('any message');

      expect(mockGit.add).toHaveBeenCalledWith(['-A']);
      expect(mockGit.commit).toHaveBeenCalledWith('GIT-123: any message');
      expect(mockGit.push).toHaveBeenCalledWith('origin', 'HEAD', ['--force']);
    });
  });

  describe('when there are staged changes', () => {

    beforeEach(() => {
      mockGit.diff.mockRejectedValueOnce(new Error('changes present'));
    });
    it('messageParam: false, cancel selected', async () => {
      mockPrompt.mockResolvedValueOnce({ action: 'cancel' });

      const consoleLogSpy = jest.spyOn(mockLogger, 'log');
  
      await commitCommand.execute();
  
      expect(mockGit.add).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('No commit message entered. Operation cancelled.');
      consoleLogSpy.mockRestore();
    });
  
    
    it('messageParam: false, new message selected', async () => {
      (prompt as jest.MockedFunction<typeof prompt>)
        .mockResolvedValueOnce({ action: 'newMessage' })
        .mockResolvedValueOnce({ message: 'feat: new feature' });
      
      await commitCommand.execute();
    
      expect(mockGit.commit).toHaveBeenCalledWith('GIT-123: feat: new feature');
      expect(prompt).toHaveBeenCalledTimes(2);
    });
    
  
    it('messageParam: false, amend selected', async () => {
      (prompt as jest.MockedFunction<typeof prompt>)
        .mockResolvedValueOnce({ action: 'amend' });
  
      await commitCommand.execute();
  
      expect(mockGit.commit).toHaveBeenCalledWith('--amend', '--no-edit');
    });

    it('should cancel the operation if no commit message is entered after prompting for new message', async () => {
      mockPrompt.mockResolvedValueOnce({ action: 'newMessage' });
      mockPrompt.mockResolvedValueOnce({ message: '' });
      const consoleLogSpy = jest.spyOn(mockLogger, 'log');
  
      await commitCommand.execute();
  
      expect(mockGit.commit).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('No commit message entered. Operation cancelled.');
      consoleLogSpy.mockRestore();
    });

    it('should push the commit with --force option', async () => {
      mockGit.diff.mockResolvedValueOnce('');
      mockPrompt.mockResolvedValueOnce({ action: 'newMessage' });
      mockPrompt.mockResolvedValueOnce({ message: 'feat: new feature' });
  
      await commitCommand.execute('test');
  
      expect(mockGit.push).toHaveBeenCalledWith('origin', 'HEAD', ['--force']);
    });
  });
});
