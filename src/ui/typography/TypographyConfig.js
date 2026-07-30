export const TypographyToken = Object.freeze({
  TITLE_FONT: "TITLE_FONT",
  CHAPTER_FONT: "CHAPTER_FONT",
  BODY_FONT: "BODY_FONT",
  HANDWRITING_FONT: "HANDWRITING_FONT",
  SYSTEM_FONT: "SYSTEM_FONT",
});

export const TypographyConfig = Object.freeze({
  [TypographyToken.TITLE_FONT]: Object.freeze({
    role: "TitleFont",
    face: "YesterdayTitle",
    source: "./assets/fonts/Title.ttf",
    local: Object.freeze(["FZKai-Z03", "STKaiti", "KaiTi"]),
    fallback: '"STKaiti", "KaiTi", "楷体", serif',
    size: "clamp(38px, 5vw, 64px)",
    color: "#4A2E1B",
    spacing: "-0.02em",
    shadow: "0 0 .7px rgba(74,46,27,.68)",
    opacity: ".96",
  }),
  [TypographyToken.CHAPTER_FONT]: Object.freeze({
    role: "ChapterFont",
    face: "YesterdayChapter",
    source: "./assets/fonts/Chapter.ttf",
    local: Object.freeze(["FZKai-Z03", "STKaiti", "KaiTi"]),
    fallback: '"STKaiti", "KaiTi", "楷体", serif',
    size: "clamp(26px, 3vw, 38px)",
    color: "#5A3822",
    spacing: ".04em",
    shadow: "0 0 .45px rgba(90,56,34,.5)",
    opacity: ".94",
  }),
  [TypographyToken.BODY_FONT]: Object.freeze({
    role: "BodyFont",
    face: "YesterdayBody",
    source: "./assets/fonts/Body.ttf",
    local: Object.freeze(["FangSong", "STFangsong", "SimSun"]),
    fallback: '"FangSong", "STFangsong", "仿宋", "SimSun", serif',
    size: "clamp(18px, 1.8vw, 24px)",
    color: "#6B5744",
    spacing: ".025em",
    shadow: "0 0 .32px rgba(107,87,68,.42)",
    opacity: ".91",
  }),
  [TypographyToken.HANDWRITING_FONT]: Object.freeze({
    role: "HandwritingFont",
    face: "YesterdayHandwriting",
    source: "./assets/fonts/Handwriting.ttf",
    local: Object.freeze(["FZKai-Z03", "STKaiti", "KaiTi"]),
    fallback: '"STKaiti", "KaiTi", "楷体", serif',
    size: "clamp(20px, 2vw, 28px)",
    color: "#686056",
    spacing: ".035em",
    shadow: "0 0 .42px rgba(61,51,40,.38)",
    opacity: ".88",
  }),
  [TypographyToken.SYSTEM_FONT]: Object.freeze({
    role: "SystemFont",
    face: "YesterdaySystem",
    source: null,
    local: Object.freeze(["Microsoft YaHei UI", "Microsoft YaHei"]),
    fallback: '"Microsoft YaHei UI", "Microsoft YaHei", sans-serif',
    size: "clamp(14px, 1.4vw, 18px)",
    color: "#3A2415",
    spacing: ".18em",
    shadow: "none",
    opacity: ".82",
  }),
});

export function getTypographyByRole(role) {
  return Object.values(TypographyConfig).find((entry) => entry.role === role);
}

export function getTypographyFamily(token) {
  const entry = TypographyConfig[token];
  if (!entry) throw new Error(`Unknown typography token: ${token}`);
  return `"${entry.face}", ${entry.fallback}`;
}
