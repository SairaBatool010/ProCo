"use client";

import React from "react";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Bell, User, Clock, Home, AlertCircle, MessageSquare, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fetchIssues, fetchProperties, fetchUser } from "@/lib/api";

type Notification = {
  id: string;
  type: "new_issue" | "status_change" | "message";
  message: string;
  meta?: string;
  timestamp: string;
  createdAt: Date;
};

function formatTimeAgo(date: Date) {
  const diffMs = Date.now() - date.getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return "just now";
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const notificationIcons: Record<string, React.ReactNode> = {
  new_issue: <AlertCircle className="h-4 w-4 text-destructive" />,
  status_change: <CheckCircle className="h-4 w-4 text-success" />,
  message: <MessageSquare className="h-4 w-4 text-primary" />,
};

export function LandlordNavbar() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [landlordName, setLandlordName] = useState("Property Manager");
  const [landlordRole, setLandlordRole] = useState("Landlord");
  const demoLandlordId = process.env.NEXT_PUBLIC_DEMO_LANDLORD_ID;

  useEffect(() => {
    let isMounted = true;
    const loadNotifications = async () => {
      try {
        const issues = await fetchIssues();
        const sorted = issues.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const createdNotifications: Notification[] = sorted.slice(0, 20).map((issue) => {
          const createdAt = new Date(issue.created_at);
          return {
            id: `new-${issue.id}`,
            type: "new_issue",
            message: `New issue reported: ${issue.summary}`,
            meta: `Tenant ${issue.tenant_id.slice(0, 8)}`,
            timestamp: formatTimeAgo(createdAt),
            createdAt,
          };
        });
        if (isMounted) {
          setNotifications(createdNotifications);
        }
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setNotifications([]);
        }
      }
    };

    loadNotifications();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadLandlord = async () => {
      try {
        let landlordId = demoLandlordId;
        if (!landlordId) {
          const properties = await fetchProperties();
          landlordId = properties[0]?.landlord_id;
        }
        if (!landlordId) return;
        const user = await fetchUser(landlordId);
        if (isMounted) {
          setLandlordName(user.name || "Property Manager");
          setLandlordRole(user.role === "landlord" ? "Landlord" : user.role);
        }
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setLandlordName("Property Manager");
          setLandlordRole("Landlord");
        }
      }
    };

    loadLandlord();
    return () => {
      isMounted = false;
    };
  }, [demoLandlordId]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card">
      <div className="container flex h-14 items-center px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold text-foreground">ProCo</span>
        </Link>

        {/* Right: Notifications and User */}
        <div className="ml-auto flex items-center gap-2">
          {/* Notifications Dropdown */}
          <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-muted-foreground" />
                {notifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                    {notifications.length > 9 ? "9+" : notifications.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-96 p-0">
              <div className="border-b border-border px-4 py-3">
                <h4 className="text-sm font-semibold text-foreground">Notifications</h4>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  <div className="divide-y divide-border">
                    {notifications.map((notification) => (
                      <div key={notification.id} className="px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted shrink-0">
                            {notificationIcons[notification.type]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground">{notification.message}</p>
                            {notification.meta && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {notification.meta}
                              </p>
                            )}
                            <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {notification.timestamp}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center">
                    <Bell className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">No new notifications</p>
                  </div>
                )}
              </div>
              <div className="border-t border-border p-2">
                <Button variant="ghost" className="w-full text-sm">
                  View all notifications
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-foreground">{landlordName}</p>
                <p className="text-xs text-muted-foreground">{landlordRole}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Back to Home Screen
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
