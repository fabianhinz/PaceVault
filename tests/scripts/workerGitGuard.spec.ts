import { describe, expect, it } from 'vitest';

import { decideWorker, MESSAGE } from '../../scripts/workerGitGuard.ts';

const bash = (command: string, agent: Record<string, string> = { agent_id: 'a1' }) => ({
  tool_name: 'Bash',
  tool_input: { command },
  ...agent,
});

describe('workerGitGuard', () => {
  it('blocks git writes in a subagent, also behind global flags and in any segment', () => {
    for (const command of [
      'git commit -m x',
      'git -c x=y stash list',
      'git --no-pager stash',
      'git -C ../x checkout main',
      'vp check && git clean -fd',
      'git switch main',
      'git branch -D old',
      'git worktree add /tmp/x',
    ]) {
      expect(decideWorker(bash(command)), command).toBe(MESSAGE);
    }
  });

  it('allows read-only git and other commands in a subagent', () => {
    for (const command of [
      'git status --short',
      'git log --grep commit',
      'git diff',
      'git branch',
      'vp check',
    ]) {
      expect(decideWorker(bash(command)), command).toBeUndefined();
    }
  });

  it('never applies to the main session', () => {
    expect(decideWorker(bash('git stash', {}))).toBeUndefined();
  });
});
