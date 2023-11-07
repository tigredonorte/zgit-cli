import { prompt } from 'enquirer';
import simpleGit, { SimpleGit } from 'simple-git';
import { ICommand } from '../ICommand';

export class CommitCommand implements ICommand {
  private git: SimpleGit;

  public constructor(git: SimpleGit = simpleGit()) {
    this.git = git;
  }

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
  
    console.log('response', response);
    if (response.action !== 'add') {
      console.log('Operation cancelled.');
      return false;
    }

    await this.git.add(['-A']);
    console.log('All changes added.');

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
        { name: 'Amend the last commit', value: 'amend' },
        { name: 'Add a new commit message', value: 'newMessage' },
        { name: 'Cancel operation', value: 'cancel' }
      ]
    });

    if (response.action === 'cancel') {
      console.log('No commit message entered. Operation cancelled.');
      return false;
    }

    if (response.action === 'amend') {
      await this.git.commit('--amend', '--no-edit');
      console.log('Commit amended.');
      return '';
    } 
    
    if (response.action === 'newMessage') {
      console.log('response', response);
      const messageResponse: { message: string } = await prompt({
        type: 'input',
        name: 'message',
        message: 'Enter your commit message:',
      });
    
      commitMessage = messageResponse.message;

      console.log('commitMessage', commitMessage);
      if (!commitMessage) {
        console.log('No commit message entered. Operation cancelled.');
        return false;
      }
      
      return commitMessage;
    }

    console.log('Operation cancelled.');
    return false; // Exit the function if user selects cancel
  }

  public async execute(commitMessage?: string): Promise<void> {
    const branchName = await this.git.revparse(['--abbrev-ref', 'HEAD']);
    const jiraTask = branchName.match(/[A-Z]+-\d+/)?.[0];

    if (!this.hasAddedFiles()) {
      return;
    }

    const result = await this.handleCommitMessage(commitMessage);
    if (result === false) {
      console.log('b2');
      return;
    }

    console.log('c');
    commitMessage = result;
    if (commitMessage) {
      const finalMessage = jiraTask ? `${jiraTask}: ${commitMessage}` : commitMessage;
      await this.git.commit(finalMessage);
    }

    console.log('d');
    await this.git.push('origin', 'HEAD', ['--force']);
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
