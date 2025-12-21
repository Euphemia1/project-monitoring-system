"use server"

import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { query } from "@/lib/db"

interface ProgressItem {
  id: string
  project_id: string
  project_name: string
  status: string
  progress: number
  last_updated: string | Date
}

export default async function ProgressPage() {
  try {
    // Fetch progress data from your MySQL database
    const progressItems = await query(`
      SELECT 
        p.id,
        p.project_id,
        pr.contract_name as project_name,
        p.status,
        p.progress_percentage as progress,
        p.updated_at as last_updated
      FROM progress_updates p
      JOIN projects pr ON p.project_id = pr.id
      ORDER BY p.updated_at DESC
    `) as ProgressItem[]

    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Header
          title="Project Progress"
          description="Track the progress of all construction projects"
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.isArray(progressItems) ? (
            progressItems.map((item) => (
              <Card key={item.id} className="border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {item.project_name || 'Unnamed Project'}
                  </CardTitle>
                  <Badge variant={item.status === 'on_track' ? 'default' : 'destructive'}>
                    {item.status ? item.status.replace(/_/g, ' ') : 'unknown'}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {typeof item.progress === 'number' ? `${item.progress}%` : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Last updated: {item.last_updated ? new Date(item.last_updated).toLocaleDateString() : 'N/A'}
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-3 text-center py-8">
              <p className="text-muted-foreground">No progress data available</p>
            </div>
          )}
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading progress:', error)
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Header
          title="Project Progress"
          description="Error loading progress data"
        />
        <div className="text-red-500">
          Failed to load progress data. Please try again later.
        </div>
      </div>
    )
  }
}