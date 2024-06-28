import { IParentHelper } from './ParentHelper';

export class MockParentHelper implements IParentHelper {
  getParents = jest.fn();
  getParent = jest.fn();
}
