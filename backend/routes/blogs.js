const express = require('express');
const slugify = require('slugify');
const Blog = require('../models/Blog');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');
const { projectApiKey } = require('../middleware/apiKey');
const { publicLimiter, adminLimiter } = require('../middleware/rateLimiter');
const { upload, cloudinary } = require('../config/cloudinary');
const router = express.Router();

// ── HELPER ────────────────────────────────────────────────────────────────────
const uniqueSlugForProject = async (baseSlug, projectId, excludeId = null) => {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { slug, project: projectId };
    if (excludeId) query._id = { $ne: excludeId };

    const existing = await Blog.findOne(query);
    if (!existing) return slug;

    counter++;
    slug = `${baseSlug}-${counter}`;
  }
};

// Sanitize slug — allow letters, numbers, hyphens only
const sanitizeSlug = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')  // replace invalid chars with hyphen
    .replace(/-+/g, '-')           // collapse multiple hyphens
    .replace(/^-|-$/g, '');        // trim leading/trailing hyphens

// ── PUBLIC ROUTES ─────────────────────────────────────────────────────────────

router.get('/project/:projectSlug', publicLimiter, projectApiKey, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const project = await Project.findOne({
      slug: req.params.projectSlug,
      isActive: true,
    });

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const total = await Blog.countDocuments({ project: project._id, status: 'published' });

    const blogs = await Blog.find({ project: project._id, status: 'published' })
      .select('title slug featuredImage metaTitle metaDescription publishedAt createdAt')
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

router.get('/project/:projectSlug/slug/:slug', publicLimiter, projectApiKey, async (req, res) => {
  try {
    const project = await Project.findOne({
      slug: req.params.projectSlug,
      isActive: true,
    });

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const blog = await Blog.findOne({
      slug: req.params.slug,
      project: project._id,
      status: 'published',
    })

    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    res.json(blog);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── ADMIN ROUTES ──────────────────────────────────────────────────────────────

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

    const { title, content, project, metaTitle, metaDescription, status, slug: rawSlug } = req.body;

    if (!project) return res.status(400).json({ message: 'Project is required' });

    // Use admin's custom slug if provided, otherwise generate from title
    const baseSlug = rawSlug
      ? sanitizeSlug(rawSlug)
      : sanitizeSlug(slugify(title, { lower: true, strict: true }));

    if (!baseSlug) return res.status(400).json({ message: 'Invalid slug' });

    // Ensure unique within this project
    const slug = await uniqueSlugForProject(baseSlug, project);

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

    // If admin sent a custom slug — use it (sanitized + unique check)
    // If title changed but no custom slug — generate from new title
    // If neither — keep existing slug
    if (req.body.slug) {
      const baseSlug = sanitizeSlug(req.body.slug);
      if (!baseSlug) return res.status(400).json({ message: 'Invalid slug' });
      const projectId = req.body.project || blog.project;
      updates.slug = await uniqueSlugForProject(baseSlug, projectId, blog._id);
    } else if (req.body.title && req.body.title !== blog.title) {
      const baseSlug = sanitizeSlug(slugify(req.body.title, { lower: true, strict: true }));
      const projectId = req.body.project || blog.project;
      updates.slug = await uniqueSlugForProject(baseSlug, projectId, blog._id);
    }

    const updated = await Blog.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('project', 'name slug');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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