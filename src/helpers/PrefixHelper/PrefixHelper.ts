import { injectable } from 'inversify';

export interface IPrefixHelper {
  getPrefix(branch: string): string;
  getParentPrefix(currentBranch: string): string;
  getTopLevelParentPrefix(currentBranch: string): string;
}
@injectable()
export class PrefixHelper implements IPrefixHelper {

  public getPrefix(branch: string): string {
    const segments = branch.split('-');
    const numberSegment = segments.map(segment => /\d/.test(segment));

    // Find the index where the first true appears in numberSegment array
    const firstTrueIndex = numberSegment.indexOf(true);
    // If there's no true in numberSegment array, return the branch name with a hyphen at the end
    if (firstTrueIndex === -1) {
      return `${branch}-`;
    }

    // Find the index where the first false appears after the first true
    const firstFalseAfterTrueIndex = numberSegment.indexOf(false, firstTrueIndex);

    let prefixSegments;
    if (firstFalseAfterTrueIndex === -1) {
      // If there's no false after the first true, include all segments
      prefixSegments = segments;
    } else {
      // Otherwise, include segments up to the first false after the first true
      prefixSegments = segments.slice(0, firstFalseAfterTrueIndex);
    }

    // Join the segments back together with hyphens and add a trailing hyphen
    const prefix = prefixSegments.join('-') + '-';
    return prefix;
  }

  public getParentPrefix(currentBranch: string): string {
    const prefix = this.getPrefix(currentBranch);
    const result = prefix.replace(/-\d+-$/, '-');
    if (result === `${currentBranch}-`) {
      return 'main';
    }
    return result;
  }

  public getTopLevelParentPrefix(currentBranch: string): string {
    const segments = currentBranch.split('-');
    const numberSegment = segments.map(segment => /\d/.test(segment));
    const firstTrueIndex = numberSegment.indexOf(true);
    const granParent = segments.slice(0, firstTrueIndex);
    return granParent.join('-');
  }
}