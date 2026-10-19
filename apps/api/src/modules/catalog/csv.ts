/**
 * RFC 4180 CSV ayrıştırıcı: tırnaklı alanlar, kaçışlı tırnak (""), alan içi satır sonu, CRLF/LF, BOM.
 * Ayraç başlık satırından belirlenir (Türkçe Excel çıktıları çoğunlukla ";" kullanır).
 */
export function parseCsv(input: string): { header: string[]; rows: string[][] } {
  const text = input.replace(/^\uFEFF/, '');
  const firstLine = text.slice(0, text.search(/\r?\n|$/));
  const delimiter =
    (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';
  const records: string[][] = [];
  let field = '';
  let record: string[] = [];
  let quoted = false;
  let i = 0;
  while (i < text.length) {
    const ch = text[i]!;
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        quoted = false;
      } else {
        field += ch;
      }
      i++;
      continue;
    }
    if (ch === '"' && field === '') {
      quoted = true;
    } else if (ch === delimiter) {
      record.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      record.push(field);
      records.push(record);
      record = [];
      field = '';
      if (ch === '\r' && text[i + 1] === '\n') i++;
    } else {
      field += ch;
    }
    i++;
  }
  if (quoted) throw new Error('Kapanmamış tırnak');
  if (field !== '' || record.length) {
    record.push(field);
    records.push(record);
  }
  const nonEmpty = records.filter((r) => r.some((c) => c.trim() !== ''));
  const [header = [], ...rows] = nonEmpty;
  return { header: header.map((h) => h.trim()), rows };
}
