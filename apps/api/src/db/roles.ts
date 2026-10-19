import type { Client } from 'pg';

export const APP_ROLE = 'incelemeler_app';
export const READONLY_ROLE = 'incelemeler_readonly';

/** Yalnızca harf/rakam/alt çizgi: rol adı SQL'e tanımlayıcı olarak girer. */
function ident(name: string): string {
  if (!/^[a-z_][a-z0-9_]*$/.test(name)) throw new Error(`Geçersiz rol adı: ${name}`);
  return `"${name}"`;
}

/**
 * Veritabanı rolleri (REQ-GUV-011, A-029). Migration rolü (bağlanan sahip) şemanın sahibidir ve DDL yapar;
 * uygulama rolü yalnızca veri okur/yazar (DDL yok, `audit_log` için yalnızca SELECT + INSERT, migration tablosu salt
 * okunur); raporlama rolü salt okunur. İdempotenttir; sonraki migration'ların tabloları varsayılan yetkilerle gelir.
 * Parolalar ortamdan verilir (depoda sır yok — AK-08).
 */
export async function applyDbRoles(
  db: Client,
  passwords: { app: string; readonly: string },
): Promise<void> {
  const app = ident(APP_ROLE);
  const ro = ident(READONLY_ROLE);
  for (const [role, password] of [
    [APP_ROLE, passwords.app],
    [READONLY_ROLE, passwords.readonly],
  ] as const) {
    if (password.length < 16) throw new Error(`${role} parolası en az 16 karakter olmalı`);
    const exists = await db.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [role]);
    const verb = exists.rowCount ? 'ALTER' : 'CREATE';
    await db.query(
      `${verb} ROLE ${ident(role)} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT PASSWORD ${db.escapeLiteral(password)}`,
    );
  }
  const { rows } = await db.query<{ db: string }>('SELECT current_database() AS db');
  const database = ident(rows[0]!.db);
  await db.query(`
    REVOKE CREATE ON SCHEMA public FROM PUBLIC;
    REVOKE ALL ON DATABASE ${database} FROM PUBLIC;
    GRANT CONNECT, TEMPORARY ON DATABASE ${database} TO ${app};
    GRANT CONNECT ON DATABASE ${database} TO ${ro};
    GRANT USAGE ON SCHEMA public TO ${app}, ${ro};

    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${app};
    REVOKE UPDATE, DELETE, TRUNCATE ON audit_log FROM ${app};
    REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON _prisma_migrations FROM ${app};
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${app};
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO ${ro};
    REVOKE SELECT ON _prisma_migrations FROM ${ro};

    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${app};
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${app};
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO ${ro};
  `);
}
