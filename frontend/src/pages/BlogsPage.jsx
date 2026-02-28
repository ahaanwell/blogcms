import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchBlogs, deleteBlog } from '../store/slices/blogsSlice';
import { fetchProjects } from '../store/slices/projectsSlice';
import Layout from '../components/common/Layout';
import toast from 'react-hot-toast';

const BlogsPage = () => {
  const dispatch = useDispatch();
  const { list: blogs, loading, total, totalPages, currentPage } = useSelector((s) => s.blogs);
  const { list: projects } = useSelector((s) => s.projects);
  const [filters, setFilters] = useState({ project: '', status: '', search: '', page: 1 });

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchBlogs(filters));
  }, [dispatch, filters]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const result = await dispatch(deleteBlog(id));
    if (!result.error) {
      toast.success('Blog deleted');
      dispatch(fetchBlogs(filters));
    } else {
      toast.error('Failed to delete');
    }
  };

  const updateFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val, page: 1 }));

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-mono text-amber-500 uppercase tracking-widest mb-1">Content</p>
            <h1 className="text-3xl font-display font-bold text-white">Blog Posts</h1>
            <p className="text-slate-500 text-sm mt-1 font-body">{total} total posts across all projects</p>
          </div>
          <Link
            to="/blogs/new"
            className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-body font-semibold px-4 py-2.5 rounded-lg transition-all text-sm flex items-center gap-2"
          >
            + New Post
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6 bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
          <input
            type="text"
            placeholder="Search posts..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="flex-1 min-w-48 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 font-body focus:outline-none focus:border-amber-500 transition-colors"
          />
          <select
            value={filters.project}
            onChange={(e) => updateFilter('project', e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-body focus:outline-none focus:border-amber-500 transition-colors"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-body focus:outline-none focus:border-amber-500 transition-colors"
          >
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl overflow-hidden">
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto" />
            </div>
          ) : blogs.length === 0 ? (
            <div className="py-16 text-center text-slate-600 font-body">
              <p className="text-4xl mb-3">✦</p>
              <p className="text-lg text-slate-400 font-display font-bold mb-1">No posts found</p>
              <p className="text-sm mb-4">Create your first blog post to get started.</p>
              <Link to="/blogs/new" className="text-amber-500 hover:text-amber-400 text-sm font-mono">
                + Create post →
              </Link>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/60">
                    <th className="px-5 py-3 text-left text-xs font-mono text-slate-500 uppercase tracking-wider">Post</th>
                    <th className="px-4 py-3 text-left text-xs font-mono text-slate-500 uppercase tracking-wider hidden md:table-cell">Project</th>
                    <th className="px-4 py-3 text-left text-xs font-mono text-slate-500 uppercase tracking-wider hidden lg:table-cell">Slug</th>
                    <th className="px-4 py-3 text-left text-xs font-mono text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-mono text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {blogs.map((blog) => (
                    <tr key={blog._id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
                            <img src={blog.featuredImage?.url} alt="" className="w-full h-full object-cover" />
                          </div>
                          <p className="text-sm text-white font-body line-clamp-1">{blog.title}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="text-xs font-mono px-2 py-1 bg-slate-700 text-slate-300 rounded-full">
                          {blog.project?.name || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <span className="text-xs font-mono text-slate-500 truncate max-w-32 block">{blog.slug}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-mono border ${
                          blog.status === 'published'
                            ? 'bg-green-900/40 text-green-400 border-green-800/50'
                            : 'bg-slate-700/60 text-slate-400 border-slate-600/50'
                        }`}>
                          {blog.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            to={`/blogs/${blog._id}/edit`}
                            className="text-xs font-mono text-amber-500 hover:text-amber-400 px-2 py-1 rounded hover:bg-amber-500/10 transition-all"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(blog._id, blog.title)}
                            className="text-xs font-mono text-red-500 hover:text-red-400 px-2 py-1 rounded hover:bg-red-500/10 transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-5 py-3 border-t border-slate-700/60 flex items-center justify-between">
                  <p className="text-xs text-slate-500 font-mono">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={currentPage <= 1}
                      onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                      className="text-xs font-mono px-3 py-1.5 rounded border border-slate-700 text-slate-400 hover:border-amber-500 hover:text-amber-500 disabled:opacity-30 transition-all"
                    >
                      ← Prev
                    </button>
                    <button
                      disabled={currentPage >= totalPages}
                      onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                      className="text-xs font-mono px-3 py-1.5 rounded border border-slate-700 text-slate-400 hover:border-amber-500 hover:text-amber-500 disabled:opacity-30 transition-all"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default BlogsPage;
