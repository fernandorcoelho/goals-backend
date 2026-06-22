import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

app.listen(env.port, () => {
  console.log(`Goals backend rodando em ${env.baseUrl} (porta ${env.port})`);
});
