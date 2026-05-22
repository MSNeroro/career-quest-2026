import { app } from './app.js';
import { env } from './config/env.js';

app.listen(env.port, () => {
  console.log(`Career Quest API running on http://127.0.0.1:${env.port}`);
});
