import { readFileSync } from 'node:fs';
const date = process.argv[2] || new Date().toISOString().slice(0, 10);
const articles = JSON.parse(readFileSync('content/articles.json'));
const due = articles.filter((a) => a.reviewAfter <= date);
console.log(
  `Review date: ${date}. ${due.length} topics require manual source review.`,
);
for (const a of due)
  console.log(`${a.slug}\t${a.title}\tlast checked ${a.checkedAt}`);
// A due date only lists work. It never changes legal status or confirmation dates.
