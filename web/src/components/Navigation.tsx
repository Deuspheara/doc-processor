'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Settings, Workflow, Upload } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: FileText },
  { name: 'Upload', href: '/upload', icon: Upload },
  { name: 'Workflows', href: '/workflows', icon: Workflow },
  { name: 'Results', href: '/results', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-gray-900">
              DocProcessor
            </Link>
            <div className="flex space-x-6">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname === item.href
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
