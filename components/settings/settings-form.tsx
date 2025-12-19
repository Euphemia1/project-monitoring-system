"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, User, Shield, MapPin, Phone, Mail, CheckCircle } from "lucide-react"
import type { Profile, District } from "@/lib/types"

interface SettingsFormProps {
  profile: Profile & { district: District | null }
  districts: District[]
  userEmail: string
}

export function SettingsForm({ profile, districts, userEmail }: SettingsFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fullName, setFullName] = useState(profile.full_name)
  const [phone, setPhone] = useState(profile.phone || "")
  const [districtId, setDistrictId] = useState(profile.district_id || "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone: phone || null,
          district_id: districtId || null,
        })
        .eq("id", profile.id)

      if (error) throw error

      setSuccess(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleBadgeStyle = (role: string) => {
    const styles: Record<string, string> = {
      director: "bg-purple-100 text-purple-800 border-purple-200",
      project_engineer: "bg-blue-100 text-blue-800 border-blue-200",
      project_manager: "bg-emerald-100 text-emerald-800 border-emerald-200",
      viewer: "bg-gray-100 text-gray-800 border-gray-200",
    }
    return styles[role] || styles.viewer
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile Overview */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E87A1E]/10">
              <User className="h-8 w-8 text-[#E87A1E]" />
            </div>
            <div>
              <CardTitle className="text-foreground">{profile.full_name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={getRoleBadgeStyle(profile.role)}>
                  <Shield className="h-3 w-3 mr-1" />
                  {profile.role.replace("_", " ")}
                </Badge>
                {profile.district && (
                  <Badge variant="outline" className="bg-muted">
                    <MapPin className="h-3 w-3 mr-1" />
                    {profile.district.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Edit Profile Form */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Edit Profile</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email Address
              </Label>
              <Input id="email" type="email" value={userEmail} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+260 XXX XXX XXX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="district" className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                District
              </Label>
              <Select value={districtId} onValueChange={setDistrictId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Input value={profile.role.replace("_", " ")} disabled className="bg-muted capitalize" />
              <p className="text-xs text-muted-foreground">Contact an administrator to change your role</p>
            </div>

            {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

            {success && (
              <div className="rounded-lg bg-emerald-100 p-3 text-sm text-emerald-800 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Profile updated successfully
              </div>
            )}

            <Button type="submit" className="w-full bg-[#E87A1E] text-white hover:bg-[#D16A0E]" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card className="border-border bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Account created</span>
            <span className="text-foreground">
              {new Date(profile.created_at).toLocaleDateString("en-ZM", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
