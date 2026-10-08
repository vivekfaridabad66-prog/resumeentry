import { writeFileSync } from "node:fs";
import path from "node:path";

const content = "BT /F1 16 Tf 24 105 Td (Jordan Casey) Tj 0 -24 Td (Senior Software Engineer) Tj 0 -20 Td (jordan.casey@example.com) Tj 0 -20 Td (+1 415 555 0136) Tj ET";
const objects = [
  "<< /Type /Catalog /Pages 2 0 R >>",
  "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 200] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
];
let pdf = "%PDF-1.4\n";
const offsets = [0];
objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf, "binary")); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
const xrefOffset = Buffer.byteLength(pdf, "binary");
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
writeFileSync(path.join(process.cwd(), "tests", "fixtures", "sample-resume.pdf"), Buffer.from(pdf, "binary"));
