import fs from "node:fs/promises";
import path from "node:path";

type CsvIssue = {
  line: number;
  message: string;
  value: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validGenders = new Set(["f", "m"]);

async function main() {
  const testAllRows = process.argv.includes("--all");
  const rowLimit = testAllRows ? undefined : 80;
  const csvPath = path.join(process.cwd(), "randomnames.csv");
  const csv = await fs.readFile(csvPath, "utf8");
  const allLines = csv.split(/\r?\n/).filter(Boolean);
  const lines = rowLimit ? allLines.slice(0, rowLimit) : allLines;
  const issues: CsvIssue[] = [];
  const emails = new Map<string, number>();

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const columns = line.split(",");

    if (columns.length !== 6) {
      issues.push({
        line: lineNumber,
        message: `Expected 6 columns, found ${columns.length}`,
        value: line,
      });
      return;
    }

    const [id, title, firstName, lastName, gender, rawEmail] = columns;
    const email = rawEmail.toLowerCase();

    if (!/^\d+$/.test(id)) {
      issues.push({ line: lineNumber, message: "ID is not numeric", value: id });
    }

    if (!title.trim()) {
      issues.push({ line: lineNumber, message: "Title is empty", value: line });
    }

    if (!firstName.trim() || !lastName.trim()) {
      issues.push({ line: lineNumber, message: "Name is incomplete", value: line });
    }

    if (!validGenders.has(gender)) {
      issues.push({ line: lineNumber, message: "Gender must be f or m", value: gender });
    }

    if (!emailPattern.test(email)) {
      issues.push({ line: lineNumber, message: "Email is invalid", value: rawEmail });
    }

    const previousLine = emails.get(email);
    if (previousLine) {
      issues.push({
        line: lineNumber,
        message: `Duplicate email, first seen on line ${previousLine}`,
        value: rawEmail,
      });
    } else {
      emails.set(email, lineNumber);
    }
  });

  console.log(
    `Checked ${lines.length} row${lines.length === 1 ? "" : "s"} from randomnames.csv${
      rowLimit ? " used by the seed script" : ""
    }.`,
  );
  console.log(`Unique emails: ${emails.size}.`);

  if (issues.length > 0) {
    console.error(`Found ${issues.length} CSV issue(s):`);
    for (const issue of issues.slice(0, 20)) {
      console.error(`Line ${issue.line}: ${issue.message} (${issue.value})`);
    }
    if (issues.length > 20) {
      console.error(`Only the first 20 issues are shown.`);
    }
    process.exit(1);
  }

  console.log("randomnames.csv passed validation.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
