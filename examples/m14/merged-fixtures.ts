import { mergeTests, expect } from '@playwright/test';
import { test as anchorTest } from '../../shared/fixtures/index.js';
import { dataTest } from './fixtures/data-fixtures.js';

export const test = mergeTests(anchorTest, dataTest);
export { expect };
