import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { createBlog, updateBlog, fetchBlogById, clearCurrentBlog } from '../store/slices/blogsSlice';
import { fetchProjects } from '../store/slices/projectsSlice';
import Layout from '../components/common/Layout';
import RichTextEditor from '../components/editor/RichTextEditor';
import toast from 'react-hot-toast';

const InputField = ({ label, hint, children, required }) => (
  <div>
    <label className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
      {label}
      {required && <span className="text-amber-500">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-slate-600 font-body mt-1">{hint}</p>}
  </div>
);

const BlogEditorPage = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentBlog, saving, loading } = useSelector((s) => s.blogs);
  const { list: projects } = useSelector((s) => s.projects);
  const fileInputRef = useRef();

  const [form, setForm] = useState({
    title: '',
    project: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
    status: 'draft',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    dispatch(fetchProjects());
    if (isEditing) {
      dispatch(fetchBlogById(id));
    }
    return () => dispatch(clearCurrentBlog());
  }, [dispatch, id, isEditing]);

  useEffect(() => {
    if (isEditing && currentBlog) {
      setForm({
        title: currentBlog.title || '',
        project: currentBlog.project?._id || currentBlog.project || '',
        content: currentBlog.content || '',
        metaTitle: currentBlog.metaTitle || '',
        metaDescription: currentBlog.metaDescription || '',
        status: currentBlog.status || 'draft',
      });
      setImagePreview(currentBlog.featuredImage?.url || null);
    }
  }, [currentBlog, isEditing]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e, statusOverride) => {
    e.preventDefault();
    if (!form.project) { toast.error('Please select a project'); return; }
    if (!imagePreview && !isEditing) { toast.error('Please upload a featured image'); return; }
    if (!form.content || form.content === '<p></p>') { toast.error('Content cannot be empty'); return; }

    const fd = new FormData();
    Object.entries({ ...form, status: statusOverride || form.status }).forEach(([k, v]) => fd.append(k, v));
    if (imageFile) fd.append('featuredImage', imageFile);

    const action = isEditing
      ? updateBlog({ id, formData: fd })
      : createBlog(fd);

    const result = await dispatch(action);
    if (!result.error) {
      toast.success(isEditing ? 'Blog updated!' : 'Blog created!');
      navigate('/blogs');
    } else {
      toast.error(result.payload || 'Something went wrong');
    }
  };

  const inputClass = "w-full bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm font-body placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all";

  if (loading && isEditing) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <form onSubmit={handleSubmit} className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link to="/blogs" className="text-xs font-mono text-slate-600 hover:text-slate-400 transition-colors">
                ← Back to posts
              </Link>
            </div>
            <p className="text-xs font-mono text-amber-500 uppercase tracking-widest mb-1">
              {isEditing ? 'Edit Post' : 'New Post'}
            </p>
            <h1 className="text-3xl font-display font-bold text-white">
              {isEditing ? 'Edit Blog Post' : 'Create Blog Post'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'draft')}
              disabled={saving}
              className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:border-slate-500 text-sm font-body transition-all disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'published')}
              disabled={saving}
              className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-body font-semibold text-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <><span className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" /> Saving...</>
              ) : (
                isEditing ? 'Update & Publish' : 'Publish Post'
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="xl:col-span-2 space-y-6">
            {/* Title */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5">
              <InputField label="Blog Title" required>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => {
                    setForm({ ...form, title: e.target.value });
                    if (!form.metaTitle) setForm((f) => ({ ...f, title: e.target.value, metaTitle: e.target.value }));
                  }}
                  className={`${inputClass} text-lg font-display`}
                  placeholder="Enter a compelling blog title..."
                />
              </InputField>
            </div>

            {/* Content Editor */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5">
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">
                Content <span className="text-amber-500">*</span>
              </label>
              <RichTextEditor
                value={form.content}
                onChange={(html) => setForm((f) => ({ ...f, content: html }))}
              />
            </div>

            {/* SEO */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5">
              <h3 className="text-sm font-display font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-amber-500 font-mono">SEO</span> Meta Tags
              </h3>
              <div className="space-y-4">
                <InputField label="Meta Title" hint="Recommended: 50–60 characters. Leave empty to use post title.">
                  <input
                    type="text"
                    value={form.metaTitle}
                    onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                    className={inputClass}
                    placeholder="SEO title for search engines"
                    maxLength={70}
                  />
                  <div className="flex justify-end mt-1">
                    <span className={`text-xs font-mono ${form.metaTitle.length > 60 ? 'text-red-400' : 'text-slate-600'}`}>
                      {form.metaTitle.length}/60
                    </span>
                  </div>
                </InputField>

                <InputField label="Meta Description" hint="Recommended: 150–160 characters. Appears in search results.">
                  <textarea
                    value={form.metaDescription}
                    onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                    className={`${inputClass} resize-none`}
                    rows={3}
                    placeholder="Brief description for search engines..."
                    maxLength={170}
                  />
                  <div className="flex justify-end mt-1">
                    <span className={`text-xs font-mono ${form.metaDescription.length > 160 ? 'text-red-400' : 'text-slate-600'}`}>
                      {form.metaDescription.length}/160
                    </span>
                  </div>
                </InputField>
              </div>
            </div>
          </div>

          {/* Sidebar Panel */}
          <div className="space-y-5">
            {/* Project Selection */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5">
              <h3 className="text-sm font-display font-bold text-white mb-1">Project</h3>
              <p className="text-xs text-slate-500 font-body mb-3">Select which real estate project this blog belongs to.</p>
              <select
                required
                value={form.project}
                onChange={(e) => setForm({ ...form, project: e.target.value })}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="">— Select a project —</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
              {form.project && (
                <div className="mt-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-xs font-mono text-amber-400">
                    ✓ {projects.find((p) => p._id === form.project)?.name}
                  </p>
                  <p className="text-xs text-slate-600 font-mono mt-0.5">
                    /{projects.find((p) => p._id === form.project)?.slug}/blog
                  </p>
                </div>
              )}
            </div>

            {/* Featured Image */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5">
              <h3 className="text-sm font-display font-bold text-white mb-1">Featured Image</h3>
              <p className="text-xs text-slate-500 font-body mb-3">Recommended: 1200×630px, JPG or PNG</p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />

              {imagePreview ? (
                <div className="relative group">
                  <img
                    src={imagePreview}
                    alt="Featured"
                    className="w-full aspect-video object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white text-sm font-body"
                  >
                    Change Image
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="w-full aspect-video border-2 border-dashed border-slate-700 hover:border-amber-500/50 rounded-lg flex flex-col items-center justify-center gap-2 transition-colors group"
                >
                  <span className="text-2xl text-slate-600 group-hover:text-amber-500 transition-colors">🖼</span>
                  <span className="text-xs font-body text-slate-600 group-hover:text-slate-400 transition-colors">
                    Click to upload image
                  </span>
                  <span className="text-xs font-mono text-slate-700">Max 5MB</span>
                </button>
              )}
            </div>

            {/* Status */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5">
              <h3 className="text-sm font-display font-bold text-white mb-3">Publication Status</h3>
              <div className="space-y-2">
                {['draft', 'published'].map((s) => (
                  <label key={s} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    form.status === s
                      ? 'border-amber-500/40 bg-amber-500/10'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="status"
                      value={s}
                      checked={form.status === s}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="accent-amber-500"
                    />
                    <div>
                      <p className="text-sm font-body text-white capitalize">{s}</p>
                      <p className="text-xs font-mono text-slate-500">
                        {s === 'draft' ? 'Hidden from public' : 'Visible on website'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </form>
    </Layout>
  );
};

export default BlogEditorPage;
