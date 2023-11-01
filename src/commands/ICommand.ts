export interface ICommand {
  help(): string;
  execute(...args: string[]): void;
}
