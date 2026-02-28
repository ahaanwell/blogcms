import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchBlogs } from '../store/slices/blogsSlice';
import { fetchProjects } from '../store/slices/projectsSlice';
import Layout from '../components/common/Layout';

const StatCard = ({ label, value, icon, color }) => (
  <div className={`bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 relative overflow-hidden`}>
    <div className={`absolute top-0 right-0 w-16 h-16 ${color} opacity-10 rounded-bl-3xl`} />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-display font-bold text-white mt-1">{value}</p>
      </div>
      <span className="text-2xl">{icon}</span>
    </div>
  </div>
);

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { list: blogs, total } = useSelector((s) => s.blogs);
  const { list: projects } = useSelector((s) => s.projects);
  const { admin } = useSelector((s) => s.auth);

  useEffect(() => {
    dispatch(fetchBlogs({ limit: 5 }));
    dispatch(fetchProjects());
  }, [dispatch]);

  const published = blogs.filter((b) => b.status === 'published').length;
  const drafts = blogs.filter((b) => b.status === 'draft').length;

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-mono text-amber-500 uppercase tracking-widest mb-1">Overview</p>
          <h1 className="text-3xl font-display font-bold text-white">
            Good morning, {admin?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 text-sm font-body mt-1">
            Manage blog content for all your real estate projects.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Posts" value={total || blogs.length} icon="✦" color="bg-amber-500" />
          <StatCard label="Published" value={published} icon="◉" color="bg-green-500" />
          <StatCard label="Drafts" value={drafts} icon="◎" color="bg-blue-500" />
          <StatCard label="Projects" value={projects.length} icon="◈" color="bg-purple-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Blogs */}
          <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700/60 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700/60 flex items-center justify-between">
              <h2 className="font-display font-bold text-white text-sm">Recent Blog Posts</h2>
              <Link to="/blogs" className="text-xs font-mono text-amber-500 hover:text-amber-400 transition-colors">
                View all →
              </Link>
            </div>
            <div className="divide-y divide-slate-800">
              {blogs.length === 0 ? (
                <div className="px-5 py-8 text-center text-slate-600 text-sm font-body">
                  No blog posts yet.{' '}
                  <Link to="/blogs/new" className="text-amber-500 hover:underline">Create your first post</Link>
                </div>
              ) : (
                blogs.map((blog) => (
                  <div key={blog._id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-800/40 transition-colors group">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
                      <img src={blog.featuredImage?.url} alt={blog.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-body truncate">{blog.title}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{blog.project?.name}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                        blog.status === 'published'
                          ? 'bg-green-900/40 text-green-400 border border-green-800/50'
                          : 'bg-slate-700 text-slate-400 border border-slate-600'
                      }`}>
                        {blog.status}
                      </span>
                      <Link to={`/blogs/${blog._id}/edit`} className="opacity-0 group-hover:opacity-100 text-xs text-amber-500 font-mono transition-opacity">
                        Edit
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Projects */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700/60 flex items-center justify-between">
              <h2 className="font-display font-bold text-white text-sm">Projects</h2>
              <Link to="/projects" className="text-xs font-mono text-amber-500 hover:text-amber-400 transition-colors">
                Manage →
              </Link>
            </div>
            <div className="divide-y divide-slate-800">
              {projects.length === 0 ? (
                <div className="px-5 py-8 text-center text-slate-600 text-sm font-body">
                  No projects yet.{' '}
                  <Link to="/projects" className="text-amber-500 hover:underline">Add one</Link>
                </div>
              ) : (
                projects.map((project, i) => {
                  const colors = ['bg-amber-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500'];
                  const blogCount = blogs.filter((b) => b.project?._id === project._id || b.project === project._id).length;
                  return (
                    <div key={project._id} className="px-5 py-3.5 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${colors[i % colors.length]} flex items-center justify-center text-white font-display font-bold text-xs flex-shrink-0`}>
                        {project.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-body truncate">{project.name}</p>
                        <p className="text-xs text-slate-600 font-mono">{project.slug}</p>
                      </div>
                      <span className="text-xs font-mono text-slate-500">{blogCount} posts</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Quick action */}
        <div className="mt-6">
          <Link
            to="/blogs/new"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-body font-semibold px-5 py-2.5 rounded-lg transition-all text-sm shadow-lg shadow-amber-500/20"
          >
            + Create New Blog Post
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
