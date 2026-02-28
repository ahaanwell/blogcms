const express = require('express');
const slugify = require('slugify');
const Blog = require('../models/Blog');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');
const { projectApiKey } = require('../middleware/apiKey');
const { publicLimiter, adminLimiter } = require('../middleware/rateLimiter');
const { upload, cloudinary } = require('../config/cloudinary');
const router = express.Router();

// ── PUBLIC ROUTES ─────────────────────────────────────────────────────────────
// These require a valid x-api-key that matches the project slug.
// Each real estate website has its own unique key — it can ONLY fetch
// its own project's blogs, not other projects.

/**
 * GET /api/blogs/project/:projectSlug
 * Used by project websites to fetch their own blogs.
 *
 * Required header:  x-api-key: sk_sobha_xxxxx
 * The key must be registered for "sobha-neopolis" in .env PROJECT_API_KEYS
 */
router.get('/project/:projectSlug', publicLimiter, projectApiKey, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const project = await Project.findOne({
      slug: req.params.projectSlug,
      isActive: true,
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const total = await Blog.countDocuments({
      project: project._id,
      status: 'published',
    });

    const blogs = await Blog.find({ project: project._id, status: 'published' })
      .select('title slug featuredImage metaTitle metaDescription publishedAt createdAt')
      .populate('project', 'name slug')
      .sort('-publishedAt')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    res.json({
      blogs,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/blogs/slug/:slug
 * Used by project websites for the blog detail page.
 * Also requires the project's API key.
 */
router.get('/slug/:slug', publicLimiter, projectApiKey, async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, status: 'published' })
      .populate('project', 'name slug');

    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    // Extra check: make sure this key is authorized for this blog's project
    if (req.apiKeyProjectSlug && blog.project?.slug !== req.apiKeyProjectSlug) {
      return res.status(403).json({ message: 'This API key is not authorized for this blog.' });
    }

    res.json(blog);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── ADMIN ROUTES ──────────────────────────────────────────────────────────────
// All require JWT Bearer token from admin login.

// Get all blogs (with filters)
router.get('/', protect, adminLimiter, async (req, res) => {
  try {
    const { project, status, page = 1, limit = 10, search } = req.query;
    const query = {};
    if (project) query.project = project;
    if (status) query.status = status;
    if (search) query.title = { $regex: search, $options: 'i' };

    const total = await Blog.countDocuments(query);
    const blogs = await Blog.find(query)
      .populate('project', 'name slug')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ blogs, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single blog by ID
router.get('/:id', protect, adminLimiter, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate('project');
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json(blog);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create blog
router.post('/', protect, adminLimiter, upload.single('featuredImage'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Featured image is required' });

    const { title, content, project, metaTitle, metaDescription, status } = req.body;

    let slug = slugify(title, { lower: true, strict: true });
    const existing = await Blog.findOne({ slug });
    if (existing) slug = `${slug}-${Date.now()}`;

    const blog = await Blog.create({
      title,
      slug,
      featuredImage: { url: req.file.path, publicId: req.file.filename },
      content,
      project,
      metaTitle: metaTitle || title,
      metaDescription,
      status: status || 'draft',
    });

    await blog.populate('project', 'name slug');
    res.status(201).json(blog);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update blog
router.put('/:id', protect, adminLimiter, upload.single('featuredImage'), async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    const updates = { ...req.body };

    if (req.file) {
      await cloudinary.uploader.destroy(blog.featuredImage.publicId);
      updates.featuredImage = { url: req.file.path, publicId: req.file.filename };
    }

    if (req.body.title && req.body.title !== blog.title) {
      let slug = slugify(req.body.title, { lower: true, strict: true });
      const existing = await Blog.findOne({ slug, _id: { $ne: blog._id } });
      if (existing) slug = `${slug}-${Date.now()}`;
      updates.slug = slug;
    }

    const updated = await Blog.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('project', 'name slug');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete blog
router.delete('/:id', protect, adminLimiter, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    await cloudinary.uploader.destroy(blog.featuredImage.publicId);
    await Blog.findByIdAndDelete(req.params.id);

    res.json({ message: 'Blog deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
