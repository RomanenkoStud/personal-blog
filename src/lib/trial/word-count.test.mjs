import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wordCount } from './word-count.mjs';

test('counts words', () => assert.equal(wordCount('hello brave new world'), 4));
test('empty string has no words', () => assert.equal(wordCount(''), 0));
test('ignores repeated whitespace and newlines', () => assert.equal(wordCount('  a\n\nb   c  '), 3));
