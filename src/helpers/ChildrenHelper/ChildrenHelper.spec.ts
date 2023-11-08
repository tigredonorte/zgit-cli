








import simpleGit, { SimpleGit } from 'simple-git';
import { ChildrenHelper, IChildrenHelper } from './ChildrenHelper';
import { PrefixHelper } from '../PrefixHelper/PrefixHelper';

jest.mock('simple-git', () => {
  return jest.fn().mockImplementation(() => ({
    branchLocal: jest.fn(),
  }));
});

describe('ChildrenHelper', () => {
  let childrenHelper: IChildrenHelper;
  let gitMock: jest.Mocked<SimpleGit>;

  beforeEach(() => {
    gitMock = simpleGit() as jest.Mocked<SimpleGit>;
    const prefixHelper = new PrefixHelper();
    childrenHelper = new ChildrenHelper(gitMock, prefixHelper);
  });

  it('should return child branches for the current branch', async () => {
    gitMock.branchLocal.mockResolvedValue({
      all: [
        'feature-1',
        'feature-1-1',
        'feature-1-2',
        'feature-1-1-1',
        'feature-2',
        'main'
      ]
    } as never);

    const children = await childrenHelper.getChildren('feature-1');
    expect(children).toEqual(['feature-1-1', 'feature-1-2', 'feature-1-1-1']);

    const children2 = await childrenHelper.getChildren('feature-1-1');
    expect(children2).toEqual(['feature-1-1-1']);
  });

  it('should return an empty array if there are no child branches', async () => {
    gitMock.branchLocal.mockResolvedValueOnce({
      all: [
        'feature-1',
        'feature-2',
        'main'
      ]
    } as never);

    const children = await childrenHelper.getChildren('feature-1');
    expect(children).toEqual([]);
  });
  it('should return a gran children if there is no children', async () => {
    gitMock.branchLocal.mockResolvedValueOnce({
      all: [
        'feature-1-abc',
        'feature-1-1-1-1',
        'main'
      ]
    } as never);

    const children = await childrenHelper.getChildren('feature-1-abc');
    expect(children).toEqual(['feature-1-1-1-1']);
  });
});
