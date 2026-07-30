/**
 * Ch9 漫画章 — 旧时光风铃的叙事演绎
 * 漫画路径占位，等素材到了直接替换 PAGES 数组
 */

import { ComicChapter } from '../comic/ComicChapter.js';

const PAGES = [
  './assets/images/ch9_comic_01.png',
  './assets/images/ch9_comic_02.png',
  './assets/images/ch9_comic_03.png',
  './assets/images/ch9_comic_04.png',
];

export class Ch09Comic extends ComicChapter {
  constructor(game) {
    super(game, 'chapter_09', PAGES, 75, 9);
  }
}
