import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
  regenerateKey,
} from '../store/slices/projectsSlice';
import Layout from '../components/common/Layout';
import toast from 'react-hot-toast';

const PROJECT_COLORS = [
  'bg-amber-500','bg-blue-500','bg-green-500','bg-purple-500',
  'bg-pink-500','bg-orange-500','bg-cyan-500','bg-rose-500',
];

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
        <h2 className="font-display font-bold text-white">{title}</h2>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-2xl leading-none">×</button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

const CopyBtn = ({ text, label = 'Copy' }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className={`text-xs font-mono px-2.5 py-1 rounded transition-all flex-shrink-0 ${
        copied ? 'bg-green-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
      }`}
    >
      {copied ? '✓ Copied' : label}
    </button>
  );
};

const OriginsInput = ({ value, onChange }) => {
  const [input, setInput] = useState('');

  const add = () => {
    const trimmed = input.trim().replace(/\/$/, '');
    if (!trimmed) return;
    if (!trimmed.startsWith('http')) { toast.error('Origin must start with http:// or https://'); return; }
    if (value.includes(trimmed)) { toast.error('Already added'); return; }
    onChange([...value, trimmed]);
    setInput('');
  };

  const remove = (origin) => onChange(value.filter((o) => o !== origin));

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="https://sobhaneopolis.co"
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
        />
        <button
          type="button"
          onClick={add}
          className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg text-sm transition-colors"
        >
          + Add
        </button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((origin) => (
            <span key={origin} className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-full px-3 py-1 text-xs font-mono text-slate-300">
              {origin}
              <button type="button" onClick={() => remove(origin)} className="text-slate-500 hover:text-red-400 transition-colors leading-none">×</button>
            </span>
          ))}
        </div>
      )}
      {value.length === 0 && (
        <p className="text-xs text-slate-600 font-body">No origins added — the API will block all browser requests for this project.</p>
      )}
    </div>
  );
};

const ProjectsPage = () => {
  const dispatch = useDispatch();
  const { list: projects, loading } = useSelector((s) => s.projects);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [showKey, setShowKey] = useState({});
  const [form, setForm] = useState({ name: '', description: '', website: '', allowedOrigins: [] });

  useEffect(() => { dispatch(fetchProjects()); }, [dispatch]);

  const openCreate = () => {
    setEditingProject(null);
    setForm({ name: '', description: '', website: '', allowedOrigins: [] });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditingProject(p);
    setForm({ name: p.name, description: p.description || '', website: p.website || '', allowedOrigins: [...(p.allowedOrigins || [])] });
    setShowModal(true);
  };

  const handleWebsiteBlur = () => {
    // Auto-add website URL to origins when admin fills in the website field
    const url = form.website.trim().replace(/\/$/, '');
    if (url && url.startsWith('http') && !form.allowedOrigins.includes(url)) {
      setForm((f) => ({ ...f, allowedOrigins: [...f.allowedOrigins, url] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const action = editingProject
      ? updateProject({ id: editingProject._id, ...form })
      : createProject(form);
    const result = await dispatch(action);
    if (!result.error) {
      toast.success(editingProject ? 'Project updated!' : 'Project created!');
      setShowModal(false);
      if (!editingProject) {
        // Auto-expand the newly created project to show API key
        setTimeout(() => {
          const newProject = result.payload;
          setExpandedId(newProject._id);
          setShowKey((k) => ({ ...k, [newProject._id]: true }));
        }, 300);
      }
    } else {
      toast.error(result.payload || 'Error saving project');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete project "${name}"?\nBlogs for this project will become unlinked.`)) return;
    const result = await dispatch(deleteProject(id));
    if (!result.error) toast.success('Project deleted');
    else toast.error('Failed to delete');
  };

  const handleRegenerateKey = async (id, name) => {
    if (!window.confirm(`Regenerate API key for "${name}"?\n\nThe old key will stop working immediately. You must update the project website's .env with the new key.`)) return;
    const result = await dispatch(regenerateKey(id));
    if (!result.error) {
      toast.success('API key regenerated! Update the website .env now.');
      setShowKey((k) => ({ ...k, [id]: true }));
    } else {
      toast.error('Failed to regenerate key');
    }
  };

  const inputClass = "w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm font-body placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all";

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-mono text-amber-500 uppercase tracking-widest mb-1">Settings</p>
            <h1 className="text-3xl font-display font-bold text-white">Projects</h1>
            <p className="text-slate-500 text-sm mt-1 font-body">
              Add a project → API key auto-generated → paste it in the website's .env. Done.
            </p>
          </div>
          <button onClick={openCreate} className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-body font-semibold px-4 py-2.5 rounded-lg transition-all text-sm">
            + Add Project
          </button>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {[
            { step: '1', title: 'Add Project', desc: 'Enter name + website domain(s). API key is auto-generated and saved in DB.' },
            { step: '2', title: 'Copy API Key', desc: 'Copy the key shown here and paste it into the project website\'s .env as BLOG_API_KEY.' },
            { step: '3', title: 'Fetch Blogs', desc: 'Website calls GET /api/blogs/project/your-slug with x-api-key header. Only that project\'s blogs are returned.' },
          ].map((item) => (
            <div key={item.step} className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 flex gap-3">
              <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-900 font-display font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-body font-semibold text-white mb-0.5">{item.title}</p>
                <p className="text-xs text-slate-500 font-body leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Projects list */}
        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project, i) => {
              const isExpanded = expandedId === project._id;
              const keyVisible = showKey[project._id];

              return (
                <div key={project._id} className="bg-slate-800/40 border border-slate-700/60 rounded-xl overflow-hidden transition-all">
                  {/* Project row */}
                  <div className="p-4 flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl ${PROJECT_COLORS[i % PROJECT_COLORS.length]} flex items-center justify-center text-white font-display font-bold text-base shadow-lg flex-shrink-0`}>
                      {project.name[0]}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display font-bold text-white">{project.name}</h3>
                        <span className={`inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full border ${
                          project.isActive
                            ? 'text-green-400 border-green-800/50 bg-green-900/20'
                            : 'text-slate-500 border-slate-700 bg-slate-800'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${project.isActive ? 'bg-green-400' : 'bg-slate-600'}`} />
                          {project.isActive ? 'active' : 'inactive'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <code className="text-xs font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">{project.slug}</code>
                        {project.website && (
                          <a href={project.website} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline font-mono truncate max-w-xs">
                            {project.website}
                          </a>
                        )}
                        <span className="text-xs font-mono text-slate-600">
                          {project.allowedOrigins?.length || 0} origin{project.allowedOrigins?.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : project._id)}
                        className="text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:border-amber-500 hover:text-amber-400 transition-all"
                      >
                        {isExpanded ? '▲ Hide' : '▼ API Setup'}
                      </button>
                      <button onClick={() => openEdit(project)} className="text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:border-amber-500 hover:text-amber-400 transition-all">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(project._id, project.name)} className="text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:border-red-500 hover:text-red-400 transition-all">
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Expanded: API setup info */}
                  {isExpanded && (
                    <div className="border-t border-slate-700/60 bg-slate-900/50 p-5 space-y-5">

                      {/* API Key */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">API Key</p>
                          <button
                            type="button"
                            onClick={() => handleRegenerateKey(project._id, project.name)}
                            className="text-xs font-mono text-red-400 hover:text-red-300 transition-colors"
                          >
                            ↺ Regenerate
                          </button>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5">
                          <code className="flex-1 text-sm font-mono text-amber-300 truncate">
                            {keyVisible ? project.apiKey : '•'.repeat(40)}
                          </code>
                          <button
                            type="button"
                            onClick={() => setShowKey((k) => ({ ...k, [project._id]: !k[project._id] }))}
                            className="text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
                          >
                            {keyVisible ? '🙈 Hide' : '👁 Show'}
                          </button>
                          {keyVisible && <CopyBtn text={project.apiKey} />}
                        </div>
                        <p className="text-xs text-slate-600 font-body mt-1.5">
                          Add to the <strong className="text-slate-500">{project.name}</strong> website's <code className="font-mono">.env</code>:
                          <code className="ml-1 text-slate-400 font-mono">BLOG_API_KEY={keyVisible ? project.apiKey : 'sk_...'}</code>
                        </p>
                      </div>

                      {/* Allowed Origins */}
                      <div>
                        <p className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">Allowed Origins (CORS)</p>
                        {project.allowedOrigins?.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {project.allowedOrigins.map((origin) => (
                              <span key={origin} className="text-xs font-mono bg-slate-800 border border-slate-700 rounded-full px-3 py-1 text-green-400">
                                ✓ {origin}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
                            <span className="text-red-400 text-sm">⚠️</span>
                            <p className="text-xs text-red-300 font-body">No origins set — browser requests will be blocked by CORS. Click Edit to add origins.</p>
                          </div>
                        )}
                      </div>

                      {/* Code snippet */}
                      <div>
                        <p className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">Usage in {project.name} website</p>
                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 relative group">
                          <pre className="text-xs font-mono text-slate-300 overflow-x-auto">{`// Next.js — server side only (key stays secret)
export async function getServerSideProps() {
  const res = await fetch(
    '${process.env.REACT_APP_API_URL || 'https://your-api.com/api'}/blogs/project/${project.slug}',
    { headers: { 'x-api-key': process.env.BLOG_API_KEY } }
  );
  const { blogs } = await res.json();
  return { props: { blogs } };
}`}</pre>
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <CopyBtn text={`export async function getServerSideProps() {\n  const res = await fetch(\n    'https://your-api.com/api/blogs/project/${project.slug}',\n    { headers: { 'x-api-key': process.env.BLOG_API_KEY } }\n  );\n  const { blogs } = await res.json();\n  return { props: { blogs } };\n}`} label="Copy" />
                          </div>
                        </div>
                      </div>

                      {/* Warning */}
                      <div className="flex gap-2 bg-yellow-900/20 border border-yellow-800/40 rounded-lg p-3">
                        <span className="flex-shrink-0">⚠️</span>
                        <p className="text-xs text-yellow-300/80 font-body">
                          <strong>Never expose the API key in client-side JS.</strong> Always call from the server side (Next.js getServerSideProps, API routes, etc). The key is safe in <code className="font-mono">.env</code> on the project website's server.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {projects.length === 0 && !loading && (
              <div className="py-16 text-center bg-slate-800/20 border border-slate-800 rounded-xl">
                <p className="text-4xl mb-3">◈</p>
                <p className="text-lg text-slate-400 font-display font-bold mb-1">No projects yet</p>
                <p className="text-sm text-slate-600 font-body mb-4">Create your first real estate project.</p>
                <button onClick={openCreate} className="text-amber-500 hover:text-amber-400 text-sm font-mono">+ Add project →</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <Modal
          title={editingProject ? `Edit: ${editingProject.name}` : 'Add New Project'}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                Project Name <span className="text-amber-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
                placeholder="e.g. Sobha Neopolis"
              />
              {form.name && (
                <p className="text-xs font-mono text-slate-600 mt-1">
                  Slug: <span className="text-amber-400">{form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}</span>
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className={`${inputClass} resize-none`}
                rows={2}
                placeholder="Brief description..."
              />
            </div>

            {/* Website */}
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                Website URL
              </label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                onBlur={handleWebsiteBlur}
                className={inputClass}
                placeholder="https://sobhaneopolis.co"
              />
              <p className="text-xs text-slate-600 font-body mt-1">
                Auto-added to allowed origins when you leave this field.
              </p>
            </div>

            {/* Allowed Origins */}
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                Allowed Origins <span className="text-amber-500">*</span>
              </label>
              <OriginsInput
                value={form.allowedOrigins}
                onChange={(origins) => setForm({ ...form, allowedOrigins: origins })}
              />
              <p className="text-xs text-slate-600 font-body mt-1.5">
                Add every domain for this website (with and without www). These are stored in the database — no .env editing needed.
              </p>
            </div>

            {/* API key notice for new projects */}
            {!editingProject && (
              <div className="bg-amber-900/20 border border-amber-800/40 rounded-lg p-3 flex gap-2">
                <span className="text-amber-400 flex-shrink-0">🔑</span>
                <p className="text-xs text-amber-300/90 font-body">
                  An API key will be <strong>auto-generated</strong> when you create this project. You'll see it on the project card — copy it into the website's <code className="font-mono">.env</code>.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white text-sm font-body transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-900 font-body font-semibold py-2.5 rounded-lg transition-all text-sm"
              >
                {editingProject ? 'Save Changes' : 'Create Project'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
};

export default ProjectsPage;
