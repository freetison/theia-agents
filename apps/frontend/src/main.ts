import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router/index';
import { HTTP_TOKEN } from './tokens/HTTP_TOKEN';
import { AGENTS_TOKEN } from './tokens/AGENTS_TOKEN';
import { SESSIONS_TOKEN } from './tokens/SESSIONS_TOKEN';
import { HttpClient } from './services/HttpClient';
import { AgentsService } from './services/AgentsService';
import { SessionsService } from './services/SessionsService';

const http = new HttpClient();
const agentsService = new AgentsService(http);
const sessionsService = new SessionsService(http);

const app = createApp(App);

app.use(router);
app.provide(HTTP_TOKEN, http);
app.provide(AGENTS_TOKEN, agentsService);
app.provide(SESSIONS_TOKEN, sessionsService);

app.mount('#app');
