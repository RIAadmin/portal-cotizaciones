'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Clientes', href: '/clientes', icon: Users },
    { name: 'Cotizaciones', href: '/cotizaciones', icon: FileText },
  ];

  return (
    <div className="sidebar">
      <h1>Portal Cotizaciones</h1>
      <nav>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link 
              key={link.name} 
              href={link.href} 
              className={`nav-link ${pathname === link.href ? 'active' : ''}`}
            >
              <Icon size={20} />
              {link.name}
            </Link>
          );
        })}
        <button 
          onClick={() => signOut()} 
          className="nav-link" 
          style={{ background: 'transparent', border: 'none', width: '100%', cursor: 'pointer' }}
        >
          <LogOut size={20} />
          Cerrar Sesión
        </button>
      </nav>
    </div>
  );
}
