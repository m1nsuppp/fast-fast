import Fastify from 'fastify';

const app = Fastify({
  logger: true,
});

app.get('/', () => ({ message: 'Hello Fastify!' }));

const start = async (): Promise<void> => {
  try {
    await app.listen({ port: 3000 });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

void start();
