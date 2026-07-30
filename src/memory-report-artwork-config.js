const SHARED_PROGRESS_AREA = Object.freeze({
  x: 14.8,
  y: 59.1,
  width: 26.4,
  height: 20.2,
});

const SHARED_PERCENTAGE_POSITION = Object.freeze({
  leftX: 8,
  leftY: 25,
  rightX: 73,
  rightY: 25,
});

const SHARED_BUTTON_AREAS = Object.freeze([
  Object.freeze({
    id: "home",
    label: "返回主界面",
    action: "home",
    image: "./记忆恢复报告新底图/memorybutton1-transparent.jpg",
    crop: Object.freeze({ x: 2.34, y: 9.57, width: 94.92, height: 84.99 }),
    x: 23.2,
    y: 83.1,
    width: 17.6,
    height: 8.9,
  }),
  Object.freeze({
    id: "archive",
    label: "查看记忆档案",
    action: "archive",
    image: "./记忆恢复报告新底图/memorybutton2-transparent.jpg",
    crop: Object.freeze({ x: 4.87, y: 18, width: 86.49, height: 63.2 }),
    x: 44.1,
    y: 83.1,
    width: 17.8,
    height: 8.9,
  }),
  Object.freeze({
    id: "continue",
    label: "继续昨日",
    action: "continue",
    image: "./记忆恢复报告新底图/memorybutton3-transparent.jpg",
    crop: Object.freeze({ x: 2.25, y: 17.44, width: 94.05, height: 63.7 }),
    x: 65.0,
    y: 83.1,
    width: 17.8,
    height: 8.9,
  }),
]);

export const ARTWORK_MEMORY_REPORT_CONFIG = Object.freeze({
  chapter_02: Object.freeze({
    chapterId: "chapter_02",
    backgroundImage: "./记忆恢复报告新底图/第二章.jpg",
    memoryFrom: 5,
    memoryTo: 15,
    progressArea: SHARED_PROGRESS_AREA,
    percentagePosition: SHARED_PERCENTAGE_POSITION,
    buttonAreas: SHARED_BUTTON_AREAS,
    coverImageOverlay: null,
  }),
  chapter_03: Object.freeze({
    chapterId: "chapter_03",
    backgroundImage: "./记忆恢复报告新底图/第三章.jpg",
    memoryFrom: 15,
    memoryTo: 15,
    progressArea: SHARED_PROGRESS_AREA,
    percentagePosition: SHARED_PERCENTAGE_POSITION,
    buttonAreas: SHARED_BUTTON_AREAS,
    coverImageOverlay: null,
  }),
  chapter_05: Object.freeze({
    chapterId: "chapter_05",
    backgroundImage: "./记忆恢复报告新底图/第五章.jpg",
    memoryFrom: 25,
    memoryTo: 35,
    progressArea: SHARED_PROGRESS_AREA,
    percentagePosition: SHARED_PERCENTAGE_POSITION,
    buttonAreas: SHARED_BUTTON_AREAS,
    coverImageOverlay: null,
  }),
  chapter_06: Object.freeze({
    chapterId: "chapter_06",
    backgroundImage: "./记忆恢复报告新底图/第六章.jpg",
    memoryFrom: 35,
    memoryTo: 45,
    progressArea: SHARED_PROGRESS_AREA,
    percentagePosition: SHARED_PERCENTAGE_POSITION,
    buttonAreas: SHARED_BUTTON_AREAS,
    coverImageOverlay: null,
  }),
});

export const ARTWORK_CHAPTER_ORDER = Object.freeze([
  "chapter_02",
  "chapter_03",
  "chapter_05",
  "chapter_06",
]);

export function getArtworkMemoryReportConfig(chapterId) {
  return ARTWORK_MEMORY_REPORT_CONFIG[chapterId] ??
    ARTWORK_MEMORY_REPORT_CONFIG.chapter_02;
}

export function getNextArtworkChapter(chapterId) {
  const index = ARTWORK_CHAPTER_ORDER.indexOf(chapterId);
  return ARTWORK_CHAPTER_ORDER[
    index < 0 ? 0 : (index + 1) % ARTWORK_CHAPTER_ORDER.length
  ];
}

const CONFIG_SOURCE = "./src/ui/memory-report-config.json";

export async function loadArtworkMemoryReportConfig(
  chapterId,
  overrides = {},
) {
  try {
    const response = await fetch(CONFIG_SOURCE);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const documentConfig = await response.json();
    const resolvedChapter =
      documentConfig.chapters?.[chapterId] ??
      documentConfig.chapters?.[documentConfig.defaultChapter];
    if (!resolvedChapter) throw new Error("No configured chapters");

    const order = documentConfig.chapterOrder ?? [];
    const index = order.indexOf(chapterId);
    return Object.freeze({
      ...resolvedChapter,
      chapterId: resolvedChapter === documentConfig.chapters?.[chapterId]
        ? chapterId
        : documentConfig.defaultChapter,
      memoryFrom: overrides.memoryFrom ?? resolvedChapter.memoryFrom,
      memoryTo: overrides.memoryTo ?? resolvedChapter.memoryTo,
      progressArea: documentConfig.progressArea,
      percentagePosition: documentConfig.percentagePosition,
      buttonAreas: documentConfig.buttonAreas,
      nextChapter: order[
        index < 0 ? 0 : (index + 1) % order.length
      ],
    });
  } catch (error) {
    console.warn(
      "[ArtworkMemoryReport] Using embedded baseline config.",
      error,
    );
    const fallback = getArtworkMemoryReportConfig(chapterId);
    return Object.freeze({
      ...fallback,
      memoryFrom: overrides.memoryFrom ?? fallback.memoryFrom,
      memoryTo: overrides.memoryTo ?? fallback.memoryTo,
      nextChapter: getNextArtworkChapter(fallback.chapterId),
    });
  }
}
