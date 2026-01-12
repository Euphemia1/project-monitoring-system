"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from "@/components/dashboard/header"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  FolderKanbanIcon,
  ClipboardCheckIcon,
  FileTextIcon,
  ClockIcon,
  ArrowRightIcon,
  Building2Icon,
  AlertTriangleIcon,
  Loader2Icon,
  PlusIcon
} from "@/components/icons"
import { hasPermission } from "@/lib/rbac"

// Helper function to fetch dashboard data
async function fetchDashboardData() {
  try {
    const response = await fetch('/api/dashboard/stats', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    return null;
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    totalProjects: 0,
    pendingProjects: 0,
    activeProjects: 0,
    totalDocuments: 0
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [recentReports, setRecentReports] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      // Check authentication
      const userData = localStorage.getItem('user');
      if (!userData) {
        router.push('/auth/login');
        return;
      }

      try {
        setProfile(JSON.parse(userData));
        setIsLoading(true);

        // Fetch dashboard data
        const dashboardData = await fetchDashboardData();
        
        if (dashboardData) {
          // Get user role from localStorage
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          
          // Update stats - for directors, don't show pending separately
          setStats({
            totalProjects: dashboardData.totalProjects || 0,
            pendingProjects: user.role === 'director' ? 0 : dashboardData.pendingProjects || 0,
            activeProjects: dashboardData.activeProjects || 0,
            totalDocuments: dashboardData.totalDocuments || 0
          });

          // Update recent projects
          setRecentProjects((dashboardData.recentProjects || []).map(project => ({
            ...project,
            contract_name: project.contract_name,
            district: { name: project.district_name },
            creator: { full_name: project.creator_name }
          })));

          // Update recent reports
          setRecentReports((dashboardData.recentReports || []).map(report => ({
            ...report,
            project: { contract_name: report.project_contract_name },
            creator: { full_name: report.creator_name }
          })));
        } else {
          // Fallback to default values if API fails
          setStats({
            totalProjects: 0,
            pendingProjects: 0,
            activeProjects: 0,
            totalDocuments: 0
          });
          setRecentProjects([]);
          setRecentReports([]);
        }

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2Icon className="h-8 w-8 animate-spin text-[#E87A1E]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangleIcon className="h-12 w-12 text-amber-500" />
          </div>
          <p className="text-lg font-medium mb-2">Session Expired</p>
          <p className="text-muted-foreground mb-4">Please log in to continue</p>
          <Link href="/auth/login">
            <Button className="bg-[#E87A1E] hover:bg-[#D16A0E]">
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        title={`Welcome, ${profile?.name || "User"}`}
        subtitle="Here's an overview of your projects"
      />

      <div className="p-6 space-y-6">
        {/* Quick Actions - Only show if user has create_project permission */}
        {hasPermission(profile, 'create_project') && (
          <div className="flex gap-4">
            <Link href="/dashboard/projects/new">
              <Button className="bg-[#E87A1E] hover:bg-[#D16A0E]">
                <PlusIcon className="mr-2 h-4 w-4" />
                Create New Project
              </Button>
            </Link>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Projects"
            value={stats.totalProjects}
            icon={<FolderKanbanIcon className="h-6 w-6" />}
          />
          {/* Show Pending Approval card only for non-directors */}
          {profile?.role !== 'director' && (
            <StatsCard
              title="Pending Approval"
              value={stats.pendingProjects}
              icon={<ClockIcon className="h-6 w-6" />}
              subtitle="Awaiting director review"
            />
          )}
          <StatsCard
            title="Active Projects"
            value={stats.activeProjects}
            icon={<ClipboardCheckIcon className="h-6 w-6" />}
          />
          <StatsCard
            title="Total Documents"
            value={stats.totalDocuments}
            icon={<FileTextIcon className="h-6 w-6" />}
          />
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Projects Card */}
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold">Recent Projects</CardTitle>
              <Link href="/dashboard/projects">
                <Button variant="ghost" size="sm" className="text-[#E87A1E]">
                  View All <ArrowRightIcon className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentProjects.length > 0 ? (
                <div className="space-y-4">
                  {recentProjects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{project.contract_name || project.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {project.district?.name || 'No district'}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {project.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FolderKanbanIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No projects found</p>
                  {hasPermission(profile, 'create_project') && (
                    <Link href="/dashboard/projects/new">
                      <Button variant="outline" className="mt-4">
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Create Your First Project
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Reports Card */}
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold">Recent Progress Reports</CardTitle>
              <Link href="/dashboard/progress">
                <Button variant="ghost" size="sm" className="text-[#E87A1E]">
                  View All <ArrowRightIcon className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentReports.length > 0 ? (
                <div className="space-y-4">
                  {recentReports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{report.project?.contract_name || 'Untitled Report'}</p>
                        <p className="text-sm text-muted-foreground">
                          {report.creator?.full_name || 'Unknown'} • {new Date(report.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {report.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ClipboardCheckIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No reports found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}