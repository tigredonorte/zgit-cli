import { IPrefixHelper } from './PrefixHelper';

export class MockPrefixHelper implements IPrefixHelper {
  getPrefix = jest.fn();
  getParentPrefix = jest.fn();
  getTopLevelParentPrefix = jest.fn();
}
