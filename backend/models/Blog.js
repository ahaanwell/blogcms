const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    featuredImage: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
    },
    content: { type: String, required: true },
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

// Auto-set publishedAt when status changes to published
blogSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Blog', blogSchema);
