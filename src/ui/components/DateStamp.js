import { UIComponent } from "../core/UIComponent.js";

const WEEKDAYS = Object.freeze([
  "星期日",
  "星期一",
  "星期二",
  "星期三",
  "星期四",
  "星期五",
  "星期六",
]);

function parseChineseDate(value) {
  const match = String(value ?? "").match(
    /(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日/,
  );
  if (!match) {
    return {
      year: "",
      monthDay: String(value ?? ""),
      weekday: "",
    };
  }

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), 12);
  return {
    year: `${year}年`,
    monthDay: `${Number(month)}月${Number(day)}日`,
    weekday: WEEKDAYS[date.getDay()],
  };
}

export class DateStamp extends UIComponent {
  constructor({ id, layout }) {
    super({
      id,
      className: "date-stamp",
      ariaLabel: "章节档案日期",
    });

    this.setLayout({
      position: "absolute",
      ...layout,
    });

    this.yearElement = document.createElement("span");
    this.dateElement = document.createElement("strong");
    this.weekdayElement = document.createElement("span");
    this.element.append(
      this.yearElement,
      this.dateElement,
      this.weekdayElement,
    );
  }

  setDate(value) {
    const date = parseChineseDate(value);
    this.yearElement.textContent = date.year;
    this.dateElement.textContent = date.monthDay;
    this.weekdayElement.textContent = date.weekday;
    this.element.dataset.sourceDate = value ?? "";
    return this;
  }
}
