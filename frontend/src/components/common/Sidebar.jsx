import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';

const navItems = [
  { to: '/dashboard', icon: '⬡', label: 'Dashboard' },
  { to: '/blogs', icon: '✦', label: 'Blog Posts' },
  { to: '/blogs/new', icon: '+', label: 'New Post' },
  { to: '/projects', icon: '◈', label: 'Projects' },
];

const Sidebar = () => {
  const dispatch = useDispatch();
  const { admin } = useSelector((s) => s.auth);

  return (
    <aside className="w-64 min-h-screen bg-slate-950 border-r border-slate-800 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-slate-900 font-display font-bold text-sm">
            B
          </div>
          <div>
            <p className="font-display font-bold text-white text-sm leading-none">BlogAdmin</p>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">Real Estate CMS</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-all group ${
                isActive
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/60'
              }`
            }
          >
            <span className="text-lg w-5 text-center">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-slate-900 font-bold text-xs">
            {admin?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-body truncate">{admin?.name}</p>
            <p className="text-xs text-slate-600 truncate font-mono">{admin?.email}</p>
          </div>
        </div>
        <button
          onClick={() => dispatch(logout())}
          className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-all font-mono"
        >
          → Sign out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
