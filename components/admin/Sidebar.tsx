'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquareQuote,
  MessagesSquare,
  AlertTriangle,
  ListTodo,
  Users,
  CheckCircle2,
  BarChart3,
  ShieldAlert,
  History,
  Settings,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CURRENT_ADMIN } from '@/lib/mockData';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  const navSections = [
    {
      title: 'OVERVIEW',
      items: [
        {
          label: 'Dashboard',
          href: '/admin',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: 'CONTENT',
      items: [
        {
          label: 'Decision Rooms',
          href: '/admin/posts',
          icon: MessageSquareQuote,
        },
        {
          label: 'Komentar & Ulasan',
          href: '/admin/comments',
          icon: MessagesSquare,
        },
        {
          label: 'Laporan Masuk',
          href: '/admin/reports',
          icon: AlertTriangle,
          badge: '3',
          badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
        },
        {
          label: 'Moderation Queue',
          href: '/admin/moderation',
          icon: ListTodo,
        },
      ],
    },
    {
      title: 'USERS',
      items: [
        {
          label: 'Daftar Pengguna',
          href: '/admin/users',
          icon: Users,
        },
        {
          label: 'Verifikasi Pengalaman',
          href: '/admin/verification',
          icon: CheckCircle2,
          badge: '1',
          badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
        },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        {
          label: 'Analitik Platform',
          href: '/admin/analytics',
          icon: BarChart3,
        },
        {
          label: 'Tim Administrator',
          href: '/admin/admins',
          icon: ShieldAlert,
        },
        {
          label: 'Audit Logs',
          href: '/admin/audit-logs',
          icon: History,
        },
        {
          label: 'Pengaturan',
          href: '/admin/settings',
          icon: Settings,
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-white tracking-tight flex items-center gap-1.5">
                VERA <span className="text-xs font-mono font-normal text-blue-400">OPS</span>
              </span>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Control Center</p>
            </div>
          </Link>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="px-3 text-[10px] font-semibold text-slate-500 tracking-wider mb-2 font-mono">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onCloseMobile}
                      className={cn(
                        'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group',
                        isActive
                          ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-600/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={cn('w-4 h-4 transition-colors', isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200')} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge ? (
                        <span className={cn('text-[10px] font-mono px-1.5 py-0.5 rounded-md font-semibold', item.badgeColor)}>
                          {item.badge}
                        </span>
                      ) : (
                        isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Card Bottom */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <img
              src={CURRENT_ADMIN.avatar_url}
              alt={CURRENT_ADMIN.full_name}
              className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{CURRENT_ADMIN.full_name}</p>
              <span className="inline-block text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase font-bold">
                {CURRENT_ADMIN.role}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
