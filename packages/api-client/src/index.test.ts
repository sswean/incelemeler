import { describe, expect, it } from 'vitest';
import { createApiClient } from './index.js';

describe('[REQ-MIM-006] üretilmiş tipli istemci', () => {
  it("sorgu parametreleriyle doğru URL'yi çağırır", async () => {
    const calls: string[] = [];
    const client = createApiClient('http://api.test', {
      fetch: async (input: Request) => {
        calls.push(input.url);
        return new Response(
          JSON.stringify({ data: [], page: { nextCursor: null, hasMore: false } }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        );
      },
    });
    const { data } = await client.GET('/v1/categories', { params: { query: { limit: 5 } } });
    expect(calls).toEqual(['http://api.test/v1/categories?limit=5']);
    expect(data?.page.hasMore).toBe(false);
  });
});
