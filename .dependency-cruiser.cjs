/** Modül sınırları (REQ-MIM-001, REQ-MIM-002, REQ-MIM-005) — CI'da zorlanır. */
module.exports = {
  forbidden: [
    {
      name: 'db-only-in-api',
      comment: 'REQ-MIM-001: Prisma/pg yalnızca apps/api içinde kullanılabilir.',
      severity: 'error',
      from: { pathNot: '^(apps/api|tests/e2e)/' },
      to: { path: '(^|node_modules/)(@prisma/client|@prisma/adapter-pg|pg)(/|$)' },
    },
    {
      name: 'packages-not-import-apps',
      comment: 'packages/* hiçbir zaman apps/* içinden import etmez.',
      severity: 'error',
      from: { path: '^packages/' },
      to: { path: '^apps/' },
    },
    {
      name: 'contracts-isomorphic',
      comment:
        "REQ-MIM-002: contracts tarayıcı ve React Native'de çalışmalı (Node yerleşik modülü yok).",
      severity: 'error',
      from: { path: '^packages/(contracts|i18n|routes|tokens|utils)/src' },
      to: { dependencyTypes: ['core'] },
    },
    {
      name: 'organic-ranking-independent',
      comment:
        'REQ-MIM-005 / AK-04: search, catalog, reviews iş mantığı reklam (sponsorship) ve ticaret (outbound) modüllerini import etmez; birleştirme yalnızca sunum katmanında (denetleyiciler).',
      severity: 'error',
      from: {
        path: '^apps/api/src/modules/(search|catalog|reviews)/',
        pathNot: '\\.controller\\.ts$',
      },
      to: { path: '^apps/api/src/modules/(sponsorship|outbound)/' },
    },
    {
      name: 'not-to-unresolvable',
      comment: 'Çözümlenemeyen import (eksik bağımlılık ya da yazım hatası).',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(dist|\\.next|generated|coverage)/' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.base.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'types', 'default'],
    },
  },
};
