/* eslint-disable @typescript-eslint/no-explicit-any */
import { injectable } from 'inversify';

export interface ILoggerHelper {
  log: (...args: any[]) => void;
  error: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  debug: (...args: any[]) => void;
  info: (...args: any[]) => void;
  time: (...args: any[]) => void;
}

@injectable()
export class LoggerHelper implements ILoggerHelper {
  public log = console.log;
  public error = console.error;
  public warn = console.warn;
  public debug = console.debug;
  public info = console.info;
  public time = console.time;
}