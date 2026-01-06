import { diffLines, Change } from 'diff';

export interface DiffResult {
  changes: Change[];
  stats: {
    additions: number;
    deletions: number;
    unchanged: number;
  };
}

export function compareTexts(oldText: string, newText: string): DiffResult {
  const changes = diffLines(oldText, newText);

  let additions = 0;
  let deletions = 0;
  let unchanged = 0;

  for (const change of changes) {
    const lines = change.value.split('\n').filter(l => l.length > 0).length;
    if (change.added) {
      additions += lines;
    } else if (change.removed) {
      deletions += lines;
    } else {
      unchanged += lines;
    }
  }

  return {
    changes,
    stats: { additions, deletions, unchanged }
  };
}
