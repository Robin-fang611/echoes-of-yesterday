/**
 * Ch6 漫画章 — 餐桌博弈的叙事演绎
 * 漫画路径占位，等素材到了直接替换 PAGES 数组
 */

import { ComicChapter } from '../comic/ComicChapter.js';

const PAGES = [
  './assets/images/ch6_comic_01.png',
  './assets/images/ch6_comic_02.png',
  './assets/images/ch6_comic_03.png',
  './assets/images/ch6_comic_04.png',
];

export class Ch06Comic extends ComicChapter {
  constructor(game) {
    super(game, 'chapter_06', PAGES, 45, 6);
  }
}
