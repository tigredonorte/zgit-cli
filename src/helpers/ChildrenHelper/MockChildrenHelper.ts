import { IChildrenHelper } from './ChildrenHelper';

export class MockChildrenHelper implements IChildrenHelper {
  getChildren = jest.fn();
  getNextChildrenNumber = jest.fn();
  sortArray = jest.fn();
}
