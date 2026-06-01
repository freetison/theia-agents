import { createRouter, createWebHistory } from 'vue-router';
import TeamOverview from '../views/TeamOverview/TeamOverview.vue';
import SessionHistory from '../views/SessionHistory/SessionHistory.vue';
import AgentDetail from '../views/AgentDetail/AgentDetail.vue';
import ProfileEditor from '../views/ProfileEditor/ProfileEditor.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: TeamOverview },
    { path: '/sessions', component: SessionHistory },
    { path: '/sessions/:id', component: AgentDetail },
    { path: '/sessions/:id/agents/:agentId', component: AgentDetail },
    { path: '/profiles', component: ProfileEditor },
  ],
});
