import type { WordBook, WordBookMeta } from "../../models/Word";
import { words } from "../words";

const idsByTag = (tag: string) => words.filter((word) => word.tags?.includes(tag)).map((word) => word.id);

const idsByWords = (items: string[]) => {
  const wanted = new Set(items);
  return words.filter((word) => wanted.has(word.word)).map((word) => word.id);
};

const csWordIds = idsByWords([
  "algorithm",
  "array",
  "branch",
  "class",
  "client",
  "cloud",
  "commit",
  "compile",
  "container",
  "database",
  "framework",
  "function",
  "index",
  "interface",
  "kernel",
  "library",
  "logic",
  "memory",
  "model",
  "module",
  "network",
  "object",
  "package",
  "parameter",
  "process",
  "protocol",
  "security",
  "server",
  "thread",
  "token",
  "variable",
  "vector",
  "virtual",
]);

const wordBookWordIds: Record<string, string[]> = {
  "cet4-core": idsByTag("cet4"),
  "cet6-core": idsByTag("cet6"),
  "postgraduate-core": idsByTag("postgraduate"),
  "daily-english": idsByTag("cet4").slice(0, 80),
  "cs-english": csWordIds,
  custom: [],
};

export const wordBookMetas: WordBookMeta[] = [
  {
    id: "cet4-core",
    name: "四级核心词",
    description: "适合大学英语四级备考的高频核心词。",
    category: "exam",
    level: "intermediate",
    wordCount: wordBookWordIds["cet4-core"].length,
    version: "1.0.0",
    builtIn: true,
  },
  {
    id: "cet6-core",
    name: "六级核心词",
    description: "覆盖更抽象的阅读和写作高频词。",
    category: "exam",
    level: "advanced",
    wordCount: wordBookWordIds["cet6-core"].length,
    version: "1.0.0",
    builtIn: true,
  },
  {
    id: "postgraduate-core",
    name: "考研英语核心词",
    description: "偏学术阅读、论证和长难句常见词。",
    category: "exam",
    level: "advanced",
    wordCount: wordBookWordIds["postgraduate-core"].length,
    version: "1.0.0",
    builtIn: true,
  },
  {
    id: "daily-english",
    name: "高频日常词",
    description: "用于日常阅读和基础表达的高频词。",
    category: "daily",
    level: "beginner",
    wordCount: wordBookWordIds["daily-english"].length,
    version: "1.0.0",
    builtIn: true,
  },
  {
    id: "cs-english",
    name: "计算机英语",
    description: "面向计算机专业和技术文档阅读的核心词。",
    category: "tech",
    level: "intermediate",
    wordCount: wordBookWordIds["cs-english"].length,
    version: "1.0.0",
    builtIn: true,
  },
  {
    id: "custom",
    name: "自定义词库",
    description: "导入功能将在下一阶段开放。",
    category: "custom",
    level: "beginner",
    wordCount: 0,
    version: "0.1.0",
    builtIn: false,
  },
];

export const defaultWordBooks: WordBook[] = wordBookMetas.map((meta) => ({
  id: meta.id,
  name: meta.name,
  description: meta.description,
  wordIds: wordBookWordIds[meta.id] ?? [],
  isCustom: !meta.builtIn,
}));

export const getWordBookWordIds = (bookId: string) => wordBookWordIds[bookId] ?? [];
