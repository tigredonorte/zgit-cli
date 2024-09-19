import { prompt } from 'enquirer';
import { inject, injectable } from 'inversify';
import { SimpleGit } from 'simple-git';
import { ArgumentsCamelCase, Argv } from 'yargs';
import { ILoggerHelper } from '../../helpers';
import TYPES from '../../inversify/types';
import { ICommand } from '../ICommand';

interface CommitOptions {
  message?: string;
}
@injectable()
export class CommitCommand implements ICommand<CommitOptions> {
  public constructor(
    @inject(TYPES.SimpleGit) private git: SimpleGit,
    @inject(TYPES.LoggerHelper) private logger: ILoggerHelper,
  ) { }

  public help(): string {
    return 'If no commit message is provided, the last commit will be amended.';
  }

  public configure(yargs: Argv<CommitOptions>): Argv<CommitOptions> {
    return yargs
      .positional('message', {
        describe: 'port to bind on',
        type: 'string',
        required: false,
      });
  }

  private async hasAddedFiles(): Promise<boolean> {
    const hasStagedChanges = await this.hasStagedChanges();
    if (hasStagedChanges) {
      this.logger.log('You have staged changes. Skipping add.');
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
        { name: 'newMessage', message: 'Add a new commit message' },
        { name: 'amend', message: 'Amend the last commit' },
        { name: 'cancel', message: 'Cancel operation'}
      ]
    });
    if (response.action === 'cancel') {
      this.logger.log('No commit message entered. Operation cancelled.');
      return false;
    }

    if (response.action === 'amend') {
      await this.git.raw(['commit', '--amend', '--no-edit']);
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

  public async execute(args?: ArgumentsCamelCase<CommitOptions>): Promise<void> {
    let commitMessage = args?.message;
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
    const finalMessage = jiraTask ? `${jiraTask}: ${commitMessage}` : commitMessage;
    if (commitMessage) {
      await this.git.commit(finalMessage);
      this.logger.log(`Committed with message: ${finalMessage}`);
    }

    const result2 = await this.git.push('origin', 'HEAD', ['--force']);
    const pushOutput = result2.remoteMessages.all.join('\n');

    if (!commitMessage) {
      return;
    }
    const prLinkMatch = pushOutput.match(/https?:\/\/[^\s]+/);
    if (prLinkMatch) {
      const prLink = prLinkMatch[0];
      const prNumberMatch = prLink.match(/\/(?:pull|pull-requests)\/(\d+)/);
      if (prNumberMatch) {
        const prNumber = prNumberMatch[1];

        // Construct the Markdown-formatted clickable link
        const markdownLink = `[(pull request #${prNumber})](${prLink})`;
  
        this.logger.log(`Captured PR link: ${markdownLink}`);
  
        // Amend the commit to add the Markdown link
        await this.git.raw(['commit', '--amend', '-m', `${finalMessage}\n\n${markdownLink}`]);
        this.logger.log('Commit message updated with PR link.');
        await this.git.push('origin', 'HEAD', ['--force']);
      }
    } else {
      this.logger.log('No PR link found.');
    }
    this.logger.log('Pushed to origin HEAD with force. \n', pushOutput);
  }

  private async hasStagedChanges(): Promise<boolean> {
    try {
      const result = await this.git.raw(['diff', '--cached', '--name-only']);
      return result !== '';
    } catch (error) {
      this.logger.error('Error checking for staged changes:', error);
      return false;
    }
  }
}
