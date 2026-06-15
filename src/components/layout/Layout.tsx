import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useStore } from '@/store/useStore';

export default function Layout() {
  const { sidebarCollapsed } = useStore();

  return (
    <div className="min-h-screen bg-dark-950">
      <div
        className="fixed inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 20%, rgba(229, 57, 53, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(229, 57, 53, 0.05) 0%, transparent 50%)
          `,
        }}
      />
      
      <Sidebar />
      
      <div
        className={`transition-all duration-300 min-h-screen ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <Header />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
