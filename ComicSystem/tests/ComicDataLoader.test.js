import test from 'node:test';
import assert from 'node:assert/strict';
import { ComicDataLoader } from '../ComicDataLoader.js';

test('normalizes rect and sorts panels by order', () => {
  const config = ComicDataLoader.normalize({
    image: './comic.png',
    panels: [
      { id: 'second', order: 2, shape: 'polygon', points: [[0, 0], [10, 0], [0, 10]] },
      { id: 'first', order: 1, shape: 'rect', x: 0, y: 0, width: 100, height: 40 },
    ],
  }, 'https://example.test/comics/scene.json');

  assert.equal(config.image, 'https://example.test/comics/comic.png');
  assert.deepEqual(config.panels.map(({ id }) => id), ['first', 'second']);
  assert.deepEqual(config.panels[0].points, [[0, 0], [100, 0], [100, 40], [0, 40]]);
});

test('rejects points outside percentage coordinates', () => {
  assert.throws(() => ComicDataLoader.normalize({
    image: './comic.png',
    panels: [{ id: 1, order: 1, shape: 'polygon', points: [[0, 0], [101, 0], [0, 10]] }],
  }, 'https://example.test/config.json'), /between 0 and 100/);
});
