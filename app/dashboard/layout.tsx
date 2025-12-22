"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, createContext, useContext } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { hasPermission, getRoleDisplayName, UserRole, User } from "@/lib/rbac"

export interface UserProfile extends User {
  // Add any additional profile-specific fields here
}

// Create a context for user data
export const UserContext = createContext<{
  user: UserProfile | null
  isLoading: boolean
  hasPermission: (permission: string) => boolean
  getRoleDisplayName: (role: string) => string
}>({
  user: null,
  isLoading: true,
  hasPermission: () => false,
  getRoleDisplayName: (role: string) => role
})

export const useUser = () => useContext(UserContext)

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check permissions for the current user
  const checkPermission = (permission: string): boolean => {
    return hasPermission(user, permission)
  }

  const handleSignOut = () => {
    try {
      // Clear all auth-related data
      localStorage.removeItem('user');
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      // Redirect to login page
      router.push('/auth/login');
      router.refresh(); // Ensure the page updates after sign out
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (!userData) {
          router.push('/auth/login');
          return;
        }

        const parsedUser = JSON.parse(userData);
        
        // Validate user data
        if (!parsedUser || !parsedUser.id || !parsedUser.role) {
          throw new Error('Invalid user data');
        }

        const validRoles: UserRole[] = ['director', 'project_engineer', 'project_manager', 'viewer'];
        if (!validRoles.includes(parsedUser.role)) {
          throw new Error('Invalid user role');
        }

        setUser(parsedUser);

        const validateSession = async () => {
          try {
            const response = await fetch('/api/check-auth', {
              credentials: 'include',
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              }
            });

            if (!response.ok) {
              throw new Error('Session validation failed');
            }

            const data = await response.json();
            if (!data?.authenticated || !data?.user?.id) {
              throw new Error('Not authenticated');
            }

            if (typeof window !== 'undefined') {
              localStorage.setItem('user', JSON.stringify(data.user));
            }
            setUser(data.user);
          } catch (error) {
            console.error('Auth check failed:', error);
            handleSignOut();
          }
        };

        await validateSession();

        const interval = setInterval(validateSession, 5 * 60 * 1000);
        return () => clearInterval(interval);

      } catch (error) {
        console.error('Error loading user:', error);
        handleSignOut();
      } finally {
        setIsLoading(false);
      }
    };

    const cleanupPromise = loadUser();
    return () => {
      Promise.resolve(cleanupPromise).then((cleanup) => {
        if (typeof cleanup === 'function') cleanup();
      });
    };
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E87A1E] border-t-transparent" />
      </div>
    )
  }

  return (
    <UserContext.Provider 
      value={{
        user,
        isLoading,
        hasPermission: checkPermission,
        getRoleDisplayName
      }}
    >
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8">
          {children}
        </main>
      </div>
    </UserContext.Provider>
  )
}