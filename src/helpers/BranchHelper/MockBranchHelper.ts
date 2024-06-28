import { IBranchHelper } from './BranchHelper';

export class MockBranchHelper implements IBranchHelper {
  getCurrentBranch = jest.fn();
}