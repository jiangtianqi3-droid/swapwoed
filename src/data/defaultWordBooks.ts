import type { WordBook } from "../models/Word";
import { words } from "./words";

const idsByTag = (tag: string) => words.filter((word) => word.tags?.includes(tag)).map((word) => word.id);

export const defaultWordBooks: WordBook[] = [
  {
    id: "cet4-core",
    name: "四级核心词",
    description: "适合快速建立大学英语核心词汇基础。",
    wordIds: idsByTag("cet4"),
  },
  {
    id: "cet6-core",
    name: "六级核心词",
    description: "覆盖更抽象的阅读和写作高频词。",
    wordIds: idsByTag("cet6"),
  },
  {
    id: "postgraduate",
    name: "考研英语",
    description: "偏学术阅读、论证和长难句常见词。",
    wordIds: idsByTag("postgraduate"),
  },
  {
    id: "ielts",
    name: "雅思",
    description: "面向听说读写综合场景的常用词。",
    wordIds: idsByTag("ielts"),
  },
  {
    id: "toefl",
    name: "托福",
    description: "偏校园、学术和讲座语境。",
    wordIds: idsByTag("toefl"),
  },
  {
    id: "custom",
    name: "自定义词库",
    description: "导入功能将在下一阶段开放。",
    wordIds: [],
    isCustom: true,
  },
];
