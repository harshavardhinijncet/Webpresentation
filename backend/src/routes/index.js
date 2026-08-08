import { createRouter } from '../utils/router.js';
import { authRoutes } from './auth.routes.js';
import { orgRoutes } from './org.routes.js';
import { sectionRoutes } from './section.routes.js';
import { assetRoutes } from './asset.routes.js';
import { templateRoutes } from './template.routes.js';
import { sendJson } from '../utils/http.js';
import { buildId } from '../utils/build-id.js';

export function buildRouter() {
  const router = createRouter();
  // Doubles as the keep-alive target and as the frontend's "am I stale?" probe.
  router.get('/api/health', async (req, res) => sendJson(res, 200, {
    ok: true,
    build: await buildId(),
  }));
  router.use(authRoutes());
  router.use(orgRoutes());
  router.use(sectionRoutes());
  router.use(assetRoutes());
  router.use(templateRoutes());
  return router;
}
