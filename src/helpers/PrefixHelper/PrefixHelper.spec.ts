import { IPrefixHelper, PrefixHelper } from './PrefixHelper';

describe('PrefixHelper', () => {
  let prefixHelper: IPrefixHelper;
  
  beforeEach(() => {
    prefixHelper = new PrefixHelper();
  });
  
  describe('getPrefix', () => {
    it('should return CPF-123-1-1-2- for CPF-123-1-1-2-this-is-suffix', () => {
      expect(prefixHelper.getPrefix('CPF-123-1-1-2-this-is-suffix')).toEqual('CPF-123-1-1-2-');
    });
    it('should return CPF-123-1-1-3- for CPF-123-1-1-3', () => {
      expect(prefixHelper.getPrefix('CPF-123-1-1-3')).toEqual('CPF-123-1-1-3-');
    });
    it('should return CPF-123- for CPF-123-foo-bar-zzz', () => {
      expect(prefixHelper.getPrefix('CPF-123-foo-bar-zzz')).toEqual('CPF-123-');
    });
    it('should return CPF-123-1- for CPF-123-1-foo-bar-zzz', () => {
      expect(prefixHelper.getPrefix('CPF-123-1-foo-bar-zzz')).toEqual('CPF-123-1-');
    });
    it('should return abc-def-ghi- for abc-def-ghi', () => {
      expect(prefixHelper.getPrefix('abc-def-ghi')).toEqual('abc-def-ghi-');
    });
  });
  
  describe('getParentPrefix', () => {
    it('should return the correct parent prefix for a branch with a numeric sub-level', () => {
      expect(prefixHelper.getParentPrefix('feature-1-branch-name')).toEqual('feature-');
    });
  
    it('should not consider non-numeric sub-levels as children', () => {
      expect(prefixHelper.getParentPrefix('feature-a-branch-name')).toEqual('main');
    });
  
    it('should handle branch names with multiple numeric sub-levels', () => {
      expect(prefixHelper.getParentPrefix('feature-1-2-branch-name')).toEqual('feature-1-');
    });
  });
});
  