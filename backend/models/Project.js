const mongoose = require('mongoose');
const crypto = require('crypto');

const projectSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    slug:        { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, trim: true },
    website:     { type: String, trim: true },

    // All domains allowed to call this project's public API from a browser.
    // Admin enters these in the UI — no .env editing ever needed.
    // e.g. ["https://sobhaneopolis.co", "https://www.sobhaneopolis.co"]
    allowedOrigins: [{ type: String, trim: true }],

    // Auto-generated secret key — stored in DB, shown once in admin UI.
    // The project website stores this in their own .env and sends it as x-api-key.
    apiKey: { type: String, unique: true },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Auto-generate API key on first save
projectSchema.pre('save', function (next) {
  if (!this.apiKey) {
    this.apiKey =
      'sk_' +
      this.slug.replace(/-/g, '_') +
      '_' +
      crypto.randomBytes(24).toString('hex');
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);
