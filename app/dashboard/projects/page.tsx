// app/dashboard/projects/page.tsx
"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/dashboard/header"
import { ProjectsTable } from "@/components/projects/projects-table"
import { Button } from "@/components/ui/button"
import { PlusIcon, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Project {
  id: string
  contract_no: string
  contract_name: string
  status: string
  start_date: string
  completion_date: string
  contract_sum: number
  district: {
    id: string
    name: string
    code: string
  }
  creator: {
    id: string
    full_name: string
  }
  created_at: string
  updated_at: string
}

interface District {
  id: string
  name: string
  code: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [userRole, setUserRole] = useState('viewer')
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [districtFilter, setDistrictFilter] = useState<string>('all')
  const router = useRouter()
  
  const fetchData = async () => {
    try {
      setIsRefreshing(true)
      setError(null)

      let currentUserRole = userRole
      let currentUserId = userId

      if (typeof window !== 'undefined') {
        const userStr = localStorage.getItem('user')
        if (userStr) {
          try {
            const user = JSON.parse(userStr)
            console.log('DEBUG: User data from localStorage:', user);
            currentUserRole = user?.role || 'viewer'
            currentUserId = user?.id || null
            console.log('DEBUG: Setting user role to:', currentUserRole);
            setUserRole(currentUserRole)
            setUserId(currentUserId)
          } catch (parseError) {
            console.error('Error parsing user data:', parseError)
            // Redirect to login if user data is corrupted
            router.push('/auth/login')
            return
          }
        } else {
          // Redirect to login if no user data
          router.push('/auth/login')
          return
        }
      }

      const projectsRes = await fetch('/api/projects', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      // Handle authentication errors
      if (projectsRes.status === 401) {
        // Token expired or invalid, redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user')
          document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        }
        router.push('/auth/login')
        return
      }
      
      if (!projectsRes.ok) {
        const errorText = await projectsRes.text()
        console.error('API Error:', errorText)
        throw new Error(`Failed to fetch projects: ${projectsRes.status} ${projectsRes.statusText}`)
      }

      let projectsData
      try {
        projectsData = await projectsRes.json()
      } catch (jsonError) {
        const errorText = await projectsRes.text()
        console.error('Invalid JSON response:', errorText)
        throw new Error('Invalid response from server')
      }

      // // Filter non-directors to their own created projects (until assignment tables are implemented)
      // if (currentUserRole !== 'director' && currentUserId) {
      //   projectsData = projectsData.filter((p: any) => p.creator?.id?.toString?.() === currentUserId.toString())
      // }

      setProjects(projectsData)
      setFilteredProjects(projectsData)

      const districtsRes = await fetch('/api/districts', {
        credentials: 'include'
      })
      
      // Handle authentication errors for districts
      if (districtsRes.status === 401) {
        // Token expired or invalid, redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user')
          document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        }
        router.push('/auth/login')
        return
      }
      
      if (!districtsRes.ok) {
        const errorText = await districtsRes.text()
        console.error('Districts API Error:', errorText)
        throw new Error(`Failed to fetch districts: ${districtsRes.status} ${districtsRes.statusText}`)
      }
      
      let districtsData
      try {
        districtsData = await districtsRes.json()
      } catch (jsonError) {
        const errorText = await districtsRes.text()
        console.error('Invalid JSON response from districts:', errorText)
        throw new Error('Invalid response from districts server')
      }
      
      setDistricts(districtsData)

    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load data. Please try again later.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Apply filters
  useEffect(() => {
    let result = [...projects]
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(project => 
        project.contract_no.toLowerCase().includes(term) ||
        project.contract_name.toLowerCase().includes(term) ||
        project.district?.name.toLowerCase().includes(term)
      )
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(project => project.status === statusFilter)
    }
    
    // Apply district filter
    if (districtFilter !== 'all') {
      result = result.filter(project => project.district?.id === districtFilter)
    }
    
    setFilteredProjects(result)
  }, [projects, searchTerm, statusFilter, districtFilter])

  const handleRefresh = () => {
    fetchData()
  }

  // Moved inside component to ensure it reacts to userRole changes
  // This will be defined in the render section

  if (isLoading && !isRefreshing) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Header
          title="Projects"
          description="Loading projects..."
        />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Header
          title="Projects"
          description="Error loading projects"
        />
        <div className="text-red-500">{error}</div>
        <Button onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? 'Refreshing...' : 'Retry'}
        </Button>
      </div>
    )
  }

  // Define canCreateProject inside the render section to ensure it reacts to userRole changes
  console.log('DEBUG: Current user role:', userRole);
  const canCreateProject = userRole === 'project_engineer' || userRole === 'director' || userRole === 'project_manager'

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <Header
          title="Projects"
          description="Manage all construction projects"
          className="mb-0"
        />
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          {canCreateProject && (
            <Link href="/dashboard/projects/new">
              <Button>
                <PlusIcon className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Search</label>
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending_approval">Pending Approval</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">District</label>
          <Select value={districtFilter} onValueChange={setDistrictFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by district" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Districts</SelectItem>
              {districts.map((district) => (
                <SelectItem key={district.id} value={district.id}>
                  {district.name} ({district.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {filteredProjects.length > 0 ? (
        <ProjectsTable 
          projects={filteredProjects} 
          districts={districts} 
          userRole={userRole}
          onProjectUpdated={fetchData}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-12 border rounded-lg">
          <div className="text-muted-foreground mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-400"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" x2="8" y1="13" y2="13" />
              <line x1="16" x2="8" y1="17" y2="17" />
              <line x1="10" x2="8" y1="9" y2="9" />
            </svg>
          </div>
          <h3 className="text-lg font-medium">No projects found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchTerm || statusFilter !== 'all' || districtFilter !== 'all' 
              ? 'No projects match your filters' 
              : 'Get started by creating a new project'}
          </p>
          <div className="flex gap-2">
            {(searchTerm || statusFilter !== 'all' || districtFilter !== 'all') ? (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setDistrictFilter('all')
                }}
              >
                Clear filters
              </Button>
            ) : null}
            {canCreateProject && (
              <Link href="/dashboard/projects/new">
                <Button>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}