const mockSimpleGit = {
  fetch: jest.fn(),
  checkout: jest.fn(),
  rebase: jest.fn(),
  stash: jest.fn(),
  raw: jest.fn(),
};
jest.mock('simple-git', () => jest.fn(() => mockSimpleGit));

export {
  mockSimpleGit,
};