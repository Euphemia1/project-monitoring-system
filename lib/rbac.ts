// RBAC (Role-Based Access Control) utilities
// lib/rbac.ts
export type UserRole = 'director' | 'project_engineer' | 'project_manager' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  district_id?: number | null;  // Made this consistent with both number | null
  [key: string]: any;
}

// Define permissions for each role
const rolePermissions: Record<UserRole, string[]> = {
  director: [
    'view_dashboard',
    'create_project',
    'edit_project',
    'delete_project',
    'approve_project',
    'create_progress',
    'edit_progress',
    'delete_progress',
    'upload_documents',
    'view_reports',
    'manage_users',
    'view_all_districts'
  ],
  project_engineer: [
    'view_dashboard',
    'create_project',
    'edit_project',
    'create_progress',
    'edit_progress',
    'upload_documents',
    'view_reports',
    'view_own_district'
  ],
  project_manager: [
    'view_dashboard',
    'create_progress',
    'edit_progress',
    'upload_documents',
    'view_reports',
    'view_own_district'
  ],
  viewer: [
    'view_dashboard',
    'view_reports',
    'view_own_district'
  ]
};

export const hasPermission = (user: User | null, permission: string): boolean => {
  if (!user || !user.role) return false;
  return rolePermissions[user.role]?.includes(permission) || false;
};

export const getRoleDisplayName = (role: string): string => {
  const displayNames: Record<string, string> = {
    director: 'Director',
    project_engineer: 'Project Engineer',
    project_manager: 'Project Manager',
    viewer: 'Viewer'
  };
  return displayNames[role] || role;
};

// Get filtered navigation items based on user role
export const getFilteredNavigation = (user: User | null) => {
  const baseNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboardIcon', permission: 'view_dashboard' },
    { name: 'Projects', href: '/dashboard/projects', icon: 'FolderKanbanIcon', permission: 'view_dashboard' },
    { name: 'Progress', href: '/dashboard/progress', icon: 'ClipboardListIcon', permission: 'create_progress' },
    { name: 'Documents', href: '/dashboard/documents', icon: 'FileTextIcon', permission: 'upload_documents' },
    { name: 'Reports', href: '/dashboard/reports', icon: 'BarChart3Icon', permission: 'view_reports' },
  ];

  return baseNavigation.filter(item => 
    user && hasPermission(user, item.permission)
  );
};