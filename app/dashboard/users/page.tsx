"use client"

import { useEffect, useState } from "react"
import { useUser } from "@/app/dashboard/layout"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import { UserRole, getRoleDisplayName } from "@/lib/rbac"
import { RefreshCw, Search, UserPlus } from "lucide-react"

interface ManagedUser {
    id: string
    name: string
    email: string
    role: UserRole
    phone: string | null
    is_active: boolean
    district: string | null
}

export default function UserManagementPage() {
    const { user: currentUser } = useUser()
    const [users, setUsers] = useState<ManagedUser[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [isUpdating, setIsUpdating] = useState<string | null>(null)

    const fetchUsers = async () => {
        setIsLoading(true)
        try {
            const response = await fetch("/api/users")
            if (!response.ok) throw new Error("Failed to fetch users")
            const data = await response.json()
            setUsers(data)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load users")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleUpdateRole = async (userId: string, newRole: UserRole) => {
        setIsUpdating(userId)
        try {
            const response = await fetch("/api/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: userId, role: newRole }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Failed to update role")
            }

            toast.success("User role updated successfully")
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsUpdating(null)
        }
    }

    const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
        setIsUpdating(userId)
        try {
            const response = await fetch("/api/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: userId, is_active: !currentStatus }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Failed to update status")
            }

            toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
            setUsers(users.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u))
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsUpdating(null)
        }
    }

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.district && u.district.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const roles: UserRole[] = ["director", "project_engineer", "project_manager", "viewer"]

    if (currentUser?.role !== "director") {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <p className="text-muted-foreground">You do not have permission to view this page.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground">
                        Manage system users, roles, and account statuses.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchUsers} disabled={isLoading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    {/* <Button shadow>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button> */}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Registered Users</CardTitle>
                            <CardDescription>Total {users.length} users registered on the system.</CardDescription>
                        </div>
                        <div className="relative w-72">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search users..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>District</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        Loading users...
                                    </TableCell>
                                </TableRow>
                            ) : filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((u) => (
                                    <TableRow key={u.id}>
                                        <TableCell className="font-medium">
                                            {u.name}
                                            {u.id === currentUser?.id && (
                                                <Badge variant="outline" className="ml-2 bg-blue-50">You</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>{u.email}</TableCell>
                                        <TableCell>{u.district || "N/A"}</TableCell>
                                        <TableCell>
                                            <Select
                                                defaultValue={u.role}
                                                onValueChange={(value) => handleUpdateRole(u.id, value as UserRole)}
                                                disabled={isUpdating === u.id || u.id === currentUser?.id}
                                            >
                                                <SelectTrigger className="w-40 h-8">
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {roles.map((role) => (
                                                        <SelectItem key={role} value={role}>
                                                            {getRoleDisplayName(role)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={u.is_active ? "success" : "destructive"}>
                                                {u.is_active ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggleStatus(u.id, u.is_active)}
                                                disabled={isUpdating === u.id || u.id === currentUser?.id}
                                                className={u.is_active ? "text-destructive hover:text-destructive" : "text-primary"}
                                            >
                                                {u.is_active ? "Deactivate" : "Activate"}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
