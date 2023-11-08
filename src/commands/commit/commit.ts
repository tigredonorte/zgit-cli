import { prompt } from 'enquirer';
import { inject } from 'inversify';
import { SimpleGit } from 'simple-git';
import { ILoggerHelper } from '../../helpers';
import TYPES from '../../inversify/types';
import { ICommand } from '../ICommand';

export class CommitCommand implements ICommand {
  public constructor(
    @inject(TYPES.SimpleGit) private git: SimpleGit,
    @inject(TYPES.LoggerHelper) private logger: ILoggerHelper,
  ) { }

  public help(): string {
    return 'Usage: zgit commit [commit message]\n' +
           'If no commit message is provided, the last commit will be amended.';
  }

  private async hasAddedFiles(): Promise<boolean> {
    const hasStagedChanges = await this.hasStagedChanges();
    if (hasStagedChanges) {
      return true;
    }
    const response: { action: string } = await prompt({
      type: 'select',
      name: 'action',
      message: 'You have unstaged changes. What would you like to do?',
      choices: [
        { name: 'add', message: 'Add all changes' },
        { name: 'cancel', message: 'Cancel operation' }
      ]
    });
  
    if (response.action !== 'add') {
      this.logger.log('Operation cancelled.');
      return false;
    }

    await this.git.add(['-A']);
    this.logger.log('All changes added.');

    return true;
  }

  private async handleCommitMessage(commitMessage?: string): Promise<string | false> {
    if (commitMessage) {
      return commitMessage;
    }

    const response: { action: string } = await prompt({
      type: 'select',
      name: 'action',
      message: 'Would you like to amend, add a new commit message, or cancel?',
      choices: [
        { name: 'amend', message: 'Amend the last commit' },
        { name: 'newMessage', message: 'Add a new commit message' },
        { name: 'cancel', message: 'Cancel operation'}
      ]
    });
    if (response.action === 'cancel') {
      this.logger.log('No commit message entered. Operation cancelled.');
      return false;
    }

    if (response.action === 'amend') {
      await this.git.commit('--amend', '--no-edit');
      this.logger.log('Commit amended.');
      return '';
    } 
    
    if (response.action === 'newMessage') {
      const messageResponse: { message: string } = await prompt({
        type: 'input',
        name: 'message',
        message: 'Enter your commit message:',
      });
    
      commitMessage = messageResponse.message;

      if (!commitMessage) {
        this.logger.log('No commit message entered. Operation cancelled.');
        return false;
      }
      
      return commitMessage;
    }

    this.logger.log('Operation cancelled.');
    return false;
  }

  public async execute(commitMessage?: string): Promise<void> {
    const branchName = await this.git.revparse(['--abbrev-ref', 'HEAD']);
    const jiraTask = branchName.match(/[A-Z]+-\d+/)?.[0];

    const hasAddedFiles = await this.hasAddedFiles();
    if (!hasAddedFiles) {
      return;
    }

    const result = await this.handleCommitMessage(commitMessage);
    if (result === false) {
      return;
    }

    commitMessage = result;
    if (commitMessage) {
      const finalMessage = jiraTask ? `${jiraTask}: ${commitMessage}` : commitMessage;
      await this.git.commit(finalMessage);
      this.logger.log(`Committed with message: ${finalMessage}`);
    }

    await this.git.push('origin', 'HEAD', ['--force']);
    this.logger.log('Pushed to origin HEAD with force.');
  }

  private async hasStagedChanges(): Promise<boolean> {
    try {
      await this.git.diff(['--cached', '--quiet']);
      return false;
    } catch {
      return true;
    }
  }
}
