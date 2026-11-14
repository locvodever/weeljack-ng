// @ts-check

/**
 * `pr-title` job (FR-39). The squash-merge commit subject is the PR title, and release-please reads
 * it, so it must be a Conventional Commit: `type(scope)!: subject`. The title arrives in
 * `PR_TITLE`, never on a shell line.
 */
const TYPES = [
  'feat',
  'fix',
  'perf',
  'refactor',
  'docs',
  'test',
  'build',
  'ci',
  'chore',
  'revert',
  'style',
];
const PATTERN = new RegExp(
  `^(?:${TYPES.join('|')})(?:\\([a-z0-9][a-z0-9._/-]*\\))?!?: \\S.*$`,
  'u',
);

const title = process.env['PR_TITLE'];
if (title === undefined || title.trim() === '') {
  console.error('check-pr-title: PR_TITLE is not set. The workflow passes it through `env:`.');
  process.exit(1);
}
if (title.includes('\n') || !PATTERN.test(title)) {
  console.error(
    `check-pr-title: "${title}" is not a Conventional Commit subject.\n` +
      `Expected "<type>(<scope>)!: <subject>" on one line, with <type> one of ${TYPES.join(', ')}.\n` +
      'For example: feat(weeljack-ng): add wj-select',
  );
  process.exit(1);
}
console.log(`check-pr-title: ok (${title})`);
