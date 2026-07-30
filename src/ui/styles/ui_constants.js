import {
  TypographyToken,
  getTypographyFamily,
} from "../typography/TypographyConfig.js";

export const UICanvas = Object.freeze({
  width: 1280,
  height: 720,
  aspectRatio: "16 / 9",
});

export const UILayers = Object.freeze({
  background: 0,
  paperFrame: 1,
  staticDecoration: 2,
  dynamicContent: 3,
  text: 4,
  interaction: 5,
});

export const UIColor = Object.freeze({
  titleInk: "#4A2E1B",
  chapterInk: "#5A3822",
  bodyInk: "#6B5744",
  handwritingInk: "#686056",
  controlInk: "#5A3A20",
  systemInk: "#3A2415",
});

export const MemoryReportLabels = Object.freeze({
  restored: "已恢复的记忆",
  forgotten: "尚未想起",
  archived: "已归档",
  clarity: "记忆清晰度",
  emotion: "心里的话：",
  buttons: Object.freeze(["继续昨日", "查看记忆档案", "返回主界面"]),
});

export const UITypography = Object.freeze({
  TitleFont: Object.freeze({
    family: getTypographyFamily(TypographyToken.TITLE_FONT),
    size: "clamp(38px, 5vw, 64px)",
    weight: "800",
    lineHeight: "1",
    letterSpacing: "-0.02em",
  }),
  ChapterFont: Object.freeze({
    family: getTypographyFamily(TypographyToken.CHAPTER_FONT),
    size: "clamp(26px, 3vw, 38px)",
    weight: "600",
    lineHeight: "1.2",
    letterSpacing: "0",
  }),
  BodyFont: Object.freeze({
    family: getTypographyFamily(TypographyToken.BODY_FONT),
    size: "clamp(18px, 1.8vw, 24px)",
    weight: "400",
    lineHeight: "1.7",
    letterSpacing: "0",
  }),
  HandwritingFont: Object.freeze({
    family: getTypographyFamily(TypographyToken.HANDWRITING_FONT),
    size: "clamp(20px, 2vw, 28px)",
    weight: "400",
    lineHeight: "1.35",
    letterSpacing: "0.02em",
  }),
  SystemFont: Object.freeze({
    family: getTypographyFamily(TypographyToken.SYSTEM_FONT),
    size: "clamp(14px, 1.4vw, 18px)",
    weight: "400",
    lineHeight: "1.35",
    letterSpacing: "0.18em",
  }),
  ButtonFont: Object.freeze({
    family: getTypographyFamily(TypographyToken.CHAPTER_FONT),
    size: "clamp(18px, 2vw, 26px)",
    weight: "500",
    lineHeight: "1.15",
    letterSpacing: "0.03em",
  }),
});

export const MemoryReportLayout = Object.freeze({
  photoFrame: Object.freeze({
    left: "8.1%",
    top: "5.2%",
    width: "22.5%",
    height: "29.4%",
  }),
  header: Object.freeze({
    left: "31.5%",
    top: "6.2%",
    width: "45%",
    height: "16.5%",
  }),
  chapter: Object.freeze({
    left: "31.4%",
    top: "23.8%",
    width: "46%",
    height: "11.8%",
  }),
  leftPanel: Object.freeze({
    left: "12.2%",
    top: "37.2%",
    width: "31.1%",
    height: "49.7%",
  }),
  centerPanel: Object.freeze({
    left: "43.7%",
    top: "38.5%",
    width: "25.5%",
    height: "40.8%",
  }),
  rightPanel: Object.freeze({
    left: "69.5%",
    top: "39.5%",
    width: "22.2%",
    height: "37.4%",
  }),
  stamp: Object.freeze({
    left: "75.2%",
    top: "8.5%",
    width: "8.4%",
    height: "14%",
  }),
  buttons: Object.freeze([
    Object.freeze({ left: "23.1%", top: "88.1%", width: "17.9%", height: "9%" }),
    Object.freeze({ left: "44.2%", top: "88.1%", width: "18.2%", height: "9%" }),
    Object.freeze({ left: "65.1%", top: "88.1%", width: "18.1%", height: "9%" }),
  ]),
});
