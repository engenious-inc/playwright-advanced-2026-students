import {
  workerScopeTest as test,
  expect,
} from '../../examples/m14/fixtures/worker-scope-fixtures.js';

test.describe('M14 worker scope', () => {
  test('worker label matches worker index', async ({ workerLabel }) => {
    expect(workerLabel).toMatch(/^worker-\d+$/);
  });
});
