export const minutesFromNow = (minutes: number, from = new Date()) =>
  new Date(from.getTime() + minutes * 60 * 1000);

export const daysFromNow = (days: number, from = new Date()) =>
  new Date(from.getTime() + days * 24 * 60 * 60 * 1000);

export const isDue = (isoDate?: string, now = new Date()) => {
  if (!isoDate) return false;
  return new Date(isoDate).getTime() <= now.getTime();
};

export const formatToday = () =>
  new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());

export const formatShortTime = (isoDate?: string) => {
  if (!isoDate) return "暂无";
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoDate));
};

export const sameLocalDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
