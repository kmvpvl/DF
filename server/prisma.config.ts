import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: './schema.prisma',
  config: {
    generator: {
      client: {
        provider: 'prisma-client-js',
      },
    },
    datasource: {
      mysql: {
        url: process.env.DATABASE_URL,
      },
    },
  },
});
