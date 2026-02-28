const express = require('express');
const slugify = require('slugify');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');
const { adminLimiter } = require('../middleware/rateLimiter');
const router = express.Router();

// All project routes are admin-only (JWT required)

// Get all projects — includes apiKey so admin can copy it to project website
router.get('/', protect, adminLimiter, async (req, res) => {
  try {
    const projects = await Project.find().sort('name');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single project
router.get('/:id', protect, adminLimiter, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create project
// Admin enters: name, description, website, allowedOrigins[]
// apiKey is auto-generated — returned in response so admin can copy it
router.post('/', protect, adminLimiter, async (req, res) => {
  try {
    const { name, description, website, allowedOrigins } = req.body;

    const slug = slugify(name, { lower: true, strict: true });
    const existing = await Project.findOne({ slug });
    if (existing) {
      return res.status(400).json({ message: 'A project with this name already exists.' });
    }

    // Normalize origins — remove trailing slashes, empty strings
    const normalizedOrigins = (allowedOrigins || [])
      .map((o) => o.trim().replace(/\/$/, ''))
      .filter(Boolean);

    // Also auto-add the website itself as an allowed origin if provided
    if (website) {
      const websiteOrigin = website.trim().replace(/\/$/, '');
      if (websiteOrigin && !normalizedOrigins.includes(websiteOrigin)) {
        normalizedOrigins.push(websiteOrigin);
      }
    }

    const project = await Project.create({
      name,
      slug,
      description,
      website,
      allowedOrigins: normalizedOrigins,
      // apiKey is auto-generated in the model pre-save hook
    });

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update project (name, description, website, allowedOrigins, isActive)
router.put('/:id', protect, adminLimiter, async (req, res) => {
  try {
    const { name, description, website, allowedOrigins, isActive } = req.body;

    const updates = { description, website, isActive };

    if (name) {
      const newSlug = slugify(name, { lower: true, strict: true });
      const existing = await Project.findOne({ slug: newSlug, _id: { $ne: req.params.id } });
      if (existing) return res.status(400).json({ message: 'A project with this name already exists.' });
      updates.name = name;
      updates.slug = newSlug;
    }

    if (allowedOrigins !== undefined) {
      const normalizedOrigins = allowedOrigins
        .map((o) => o.trim().replace(/\/$/, ''))
        .filter(Boolean);

      // Auto-include the main website URL
      if (website) {
        const websiteOrigin = website.trim().replace(/\/$/, '');
        if (websiteOrigin && !normalizedOrigins.includes(websiteOrigin)) {
          normalizedOrigins.push(websiteOrigin);
        }
      }
      updates.allowedOrigins = normalizedOrigins;
    }

    const project = await Project.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Regenerate API key — in case the key is compromised
router.post('/:id/regenerate-key', protect, adminLimiter, async (req, res) => {
  try {
    const crypto = require('crypto');
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    project.apiKey =
      'sk_' +
      project.slug.replace(/-/g, '_') +
      '_' +
      crypto.randomBytes(24).toString('hex');

    await project.save();
    res.json({ apiKey: project.apiKey, message: 'API key regenerated. Update the project website .env immediately.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete project
router.delete('/:id', protect, adminLimiter, async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
