"use client";

import { useRouter } from "next/navigation";
import { Building2, Home, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RoleSelectionPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo and Welcome */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-4">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground text-center text-balance">
            Welcome to ProCo
          </h1>
          <p className="mt-2 text-muted-foreground text-center">
            Please select your role to continue
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid gap-4">
          <Card
            className="cursor-pointer transition-all hover:border-primary hover:shadow-md bg-card"
            onClick={() => router.push("/tenant")}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Home className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg text-foreground">Tenant</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Report maintenance issues and track repair status
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer transition-all hover:border-primary hover:shadow-md bg-card"
            onClick={() => router.push("/dashboard")}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg text-foreground">Landlord</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Manage properties and approve maintenance requests
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Powered by AI for seamless property management
        </p>
      </div>
    </div>
  );
}
