"use client"

import { useState } from "react"
import { createAdminClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestSMTPPage() {
  const [email, setEmail] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const testEmail = async () => {
    if (!email) {
      setResult({ success: false, message: "Please enter an email address" })
      return
    }

    setIsSending(true)
    setResult(null)

    try {
      // In a real implementation, you would call a server action or API route
      // For now, we'll just simulate the process
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setResult({
        success: true,
        message: `Test email would be sent to ${email}. Check your Supabase dashboard to verify SMTP configuration.`
      })
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Failed to send test email"
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Test SMTP Configuration</CardTitle>
          <CardDescription>
            Send a test email to verify your SMTP settings are working correctly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Test Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="test@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={testEmail} 
            disabled={isSending}
            className="w-full"
          >
            {isSending ? "Sending..." : "Send Test Email"}
          </Button>
          
          {result && (
            <div className={`rounded-lg p-3 text-sm ${
              result.success 
                ? "bg-green-100 text-green-800" 
                : "bg-destructive/10 text-destructive"
            }`}>
              {result.message}
            </div>
          )}
          
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">To verify SMTP is working:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Check your Supabase Auth settings</li>
              <li>Verify SMTP credentials are correct</li>
              <li>Try signing up a new user</li>
              <li>Check your email inbox and spam folder</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}