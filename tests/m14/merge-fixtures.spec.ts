import { test, expect } from '../../examples/m14/merged-fixtures.js';

test.describe('M14 mergeTests composition', () => {
  test('merged fixtures expose namespaced email', async ({ uniqueEmail }) => {
    expect(uniqueEmail).toMatch(/^m14-.+@example\.com$/);
  });
});
