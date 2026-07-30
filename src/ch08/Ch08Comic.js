/**
 * Ch8 漫画章 — 走廊镜子的叙事演绎
 * 漫画路径占位，等素材到了直接替换 PAGES 数组
 */

import { ComicChapter } from '../comic/ComicChapter.js';

const PAGES = [
  './assets/images/ch8_corridor.jpg',
  './assets/images/ch8_mirror_wall.png',
  './assets/images/ch8_mirror_stranger.png',
  './assets/images/ch8_crack.png',
  './assets/images/ch8_hourglass.png',
  './assets/images/ch8_radio.png',
  './assets/images/ch8_mirror_smile.png',
];

export class Ch08Comic extends ComicChapter {
  constructor(game) {
    super(game, 'chapter_08', PAGES, 65, 8);
  }
}
