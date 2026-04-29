'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, DollarSign, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Clientes', href: '/clientes', icon: Users },
    { name: 'Cobranza', href: '/cobranza', icon: DollarSign },
  ];

  return (
    <div className="sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Logo without white box, bigger and rounded */}
      <div style={{ 
        padding: '10px 0', 
        marginBottom: '40px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <img 
          src="/logo.png" 
          alt="Logo" 
          style={{ 
            width: '90%', 
            height: 'auto', 
            maxHeight: '120px', 
            objectFit: 'contain',
            borderRadius: '16px'
          }} 
        />
      </div>

      <nav style={{ flexGrow: 1 }}>
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
      </nav>

      <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
        <button 
          onClick={() => signOut()} 
          className="nav-link" 
          style={{ background: 'transparent', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left', marginBottom: 0 }}
        >
          <LogOut size={20} />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
