// OpenAPI belgesini sözleşmelerden üretir (REQ-MIM-006): docs/api/openapi.json
import { readFileSync, writeFileSync } from 'node:fs';
import { buildOpenApiDocument } from '@incelemeler/contracts';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const doc = buildOpenApiDocument(pkg.version);
const out = new URL('../../../docs/api/openapi.json', import.meta.url);
writeFileSync(out, JSON.stringify(doc, null, 2) + '\n');
console.log(`OpenAPI yazıldı: ${out.pathname}`);
