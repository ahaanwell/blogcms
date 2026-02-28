/**
 * DB-backed API key middleware
 *
 * Instead of reading keys from .env, we look them up in MongoDB.
 * So when admin adds a new project in the UI, it works instantly —
 * no .env changes, no server restart needed.
 *
 * How it works:
 *  1. Request comes in with header:  x-api-key: sk_sobha_xxxxx
 *  2. We query the Project collection for a project with that apiKey
 *  3. Check the project is active
 *  4. For /project/:projectSlug routes, verify the key belongs to that slug
 *  5. Attach project to req.apiKeyProject for downstream use
 */
const Project = require('../models/Project');

const projectApiKey = async (req, res, next) => {
  // Dev bypass — set DEV_SKIP_API_KEY=true in .env during local development
  if (process.env.NODE_ENV === 'development' && process.env.DEV_SKIP_API_KEY === 'true') {
    return next();
  }

  const incomingKey = req.headers['x-api-key'];

  if (!incomingKey) {
    return res.status(401).json({ message: 'Missing x-api-key header.' });
  }

  // Look up the project by API key in the database
  const project = await Project.findOne({ apiKey: incomingKey, isActive: true }).select(
    'slug name allowedOrigins apiKey'
  );

  if (!project) {
    return res.status(403).json({ message: 'Invalid or inactive API key.' });
  }

  // For /project/:projectSlug — the key must belong to that exact project
  if (req.params.projectSlug && req.params.projectSlug !== project.slug) {
    return res.status(403).json({
      message: 'This API key is not authorized for this project.',
    });
  }

  // Make the verified project available to route handlers
  req.apiKeyProject = project;
  next();
};

module.exports = { projectApiKey };
