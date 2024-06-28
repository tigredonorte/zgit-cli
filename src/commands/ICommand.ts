import { ArgumentsCamelCase, Argv } from 'yargs';

export interface ICommand<Option = object> {
  help(): string;
  configure(yargs: Argv): Argv<Option>;
  execute(yargs?: ArgumentsCamelCase<Option>): void;
}
