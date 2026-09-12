import articlesData from '@/content/articles.json';
import sourcesData from '@/content/sources.json';
export const articles = articlesData;
export const sources = sourcesData;
export type Article = (typeof articles)[number];
export type Block = { text: string; refs: string[] };
export { matches } from './search';
