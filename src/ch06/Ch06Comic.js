/**
 * Ch6 漫画章 — 餐桌博弈的叙事演绎
 * 漫画路径占位，等素材到了直接替换 PAGES 数组
 */

import { ComicChapter } from '../comic/ComicChapter.js';

const PAGES = [
  './assets/images/ch6_1.jpg',
  './assets/images/ch6_2.jpg',
  './assets/images/ch6_3.jpg',
  './assets/images/ch6_4.jpg',
  './assets/images/ch6_5.jpg',
  './assets/images/ch6_6.jpg',
  './assets/images/ch6_7.jpg',
];

export class Ch06Comic extends ComicChapter {
  constructor(game) {
    super(game, 'chapter_06', PAGES, 45, 6);
  }
}
