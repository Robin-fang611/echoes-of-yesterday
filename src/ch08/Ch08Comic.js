/**
 * Ch8 漫画章 — 走廊镜子的叙事演绎
 * 漫画路径占位，等素材到了直接替换 PAGES 数组
 */

import { ComicChapter } from '../comic/ComicChapter.js';

const PAGES = [
  './assets/images/ch8_comic_01.png',
  './assets/images/ch8_comic_02.png',
  './assets/images/ch8_comic_03.png',
  './assets/images/ch8_comic_04.png',
];

export class Ch08Comic extends ComicChapter {
  constructor(game) {
    super(game, 'chapter_08', PAGES, 65, 8);
  }
}
