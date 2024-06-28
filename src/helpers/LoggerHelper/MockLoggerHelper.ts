import { ILoggerHelper } from './LoggerHelper';

export class MockLoggerHelper implements ILoggerHelper {
  log = jest.fn();
  error = jest.fn();
  warn = jest.fn();
  debug = jest.fn();
  info = jest.fn();
  time = jest.fn();
}
