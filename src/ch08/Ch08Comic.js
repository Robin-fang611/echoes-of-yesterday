/**
 * Ch8 漫画章 — 走廊镜子的叙事演绎
 * 漫画路径占位，等素材到了直接替换 PAGES 数组
 */

import { ComicChapter } from '../comic/ComicChapter.js';

const PAGES = [
  './assets/images/ch8_1.jpg',
  './assets/images/ch8_2.jpg',
  './assets/images/ch8_3.jpg',
  './assets/images/ch8_4.jpg',
  './assets/images/ch8_5.jpg',
  './assets/images/ch8_6.jpg',
  './assets/images/ch8_7.jpg',
];

export class Ch08Comic extends ComicChapter {
  constructor(game) {
    super(game, 'chapter_08', PAGES, 65, 8);
  }
}
