"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Bell, ChevronLeft, User, Clock, Home } from "lucide-react";
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
import { fetchIssueMessages, fetchIssues, fetchProperty, fetchUser, fetchUsers, mapIssueStatus } from "@/lib/api";
import { useActiveTenant } from "@/lib/tenant";

type Notification = {
  id: string;
  message: string;
  status?: string;
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

export function TenantNavbar() {
  const pathname = usePathname();
  const showBackButton = pathname !== "/tenant";
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { tenantId, propertyId, setActiveTenantContext } = useActiveTenant();
  const [tenantName, setTenantName] = useState("Tenant");
  const [tenantProperty, setTenantProperty] = useState("Property");
  const [tenantOptions, setTenantOptions] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!tenantId) {
      setNotifications([]);
      return;
    }

    let isMounted = true;
    const loadNotifications = async () => {
      try {
        const issues = await fetchIssues();
        const filteredIssues = issues
          .filter((issue) => issue.tenant_id === tenantId)
          .filter((issue) => (!propertyId ? true : issue.property_id === propertyId))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10);

        const statusNotifications: Notification[] = filteredIssues
          .filter((issue) => issue.status !== "pending")
          .map((issue) => {
            const createdAt = new Date(issue.created_at);
            return {
              id: `status-${issue.id}`,
              message: `Issue "${issue.summary}" status updated`,
              status: mapIssueStatus(issue.status),
              timestamp: formatTimeAgo(createdAt),
              createdAt,
            };
          });

        const messageNotificationsNested = await Promise.all(
          filteredIssues.map(async (issue) => {
            const messages = await fetchIssueMessages(issue.id);
            return messages
              .filter((message) => message.role === "landlord")
              .map((message) => {
                const createdAt = new Date(message.created_at);
                return {
                  id: `msg-${message.id}`,
                  message: `New landlord message on "${issue.summary}"`,
                  timestamp: formatTimeAgo(createdAt),
                  createdAt,
                } satisfies Notification;
              });
          })
        );

        const messageNotifications = messageNotificationsNested.flat();
        const combined = [...statusNotifications, ...messageNotifications].sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );

        if (isMounted) {
          setNotifications(combined.slice(0, 20));
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
  }, [tenantId, propertyId]);

  useEffect(() => {
    if (!tenantId) return;

    let isMounted = true;
    const loadUser = async () => {
      try {
        const user = await fetchUser(tenantId);
        if (!isMounted) return;
        setTenantName(user.name || "Tenant");
        if (user.property_id) {
          const property = await fetchProperty(user.property_id);
          if (isMounted) {
            setTenantProperty(property.address);
          }
        }
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setTenantName("Tenant");
          setTenantProperty("Property");
        }
      }
    };

    loadUser();
    return () => {
      isMounted = false;
    };
  }, [tenantId]);

  useEffect(() => {
    let isMounted = true;
    const loadTenants = async () => {
      try {
        const users = await fetchUsers("tenant");
        if (isMounted) {
          setTenantOptions(users.map((user) => ({ id: user.id, name: user.name })));
        }
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setTenantOptions([]);
        }
      }
    };
    loadTenants();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card">
      <div className="container flex h-14 items-center px-4">
        {/* Left: Back button or Logo */}
        {showBackButton ? (
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="mr-4"
          >
            <Link href="/tenant" className="flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Link>
          </Button>
        ) : null}
        
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
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="border-b border-border px-4 py-3">
                <h4 className="text-sm font-semibold text-foreground">Notifications</h4>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  <div className="divide-y divide-border">
                    {notifications.map((notification) => (
                      <div key={notification.id} className="px-4 py-3 hover:bg-muted/50 transition-colors">
                        <p className="text-sm text-foreground">{notification.message}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {notification.status && (
                            <>
                              <span className="text-xs font-medium text-primary">
                                {notification.status}
                              </span>
                              <span className="text-xs text-muted-foreground">·</span>
                            </>
                          )}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {notification.timestamp}
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
                <p className="text-sm font-medium text-foreground">{tenantName}</p>
                <p className="text-xs text-muted-foreground">{tenantProperty}</p>
              </div>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Switch Tenant
                </p>
              </div>
              {tenantOptions.length > 0 ? (
                tenantOptions.map((tenant) => (
                  <DropdownMenuItem
                    key={tenant.id}
                    onSelect={async () => {
                      try {
                        const user = await fetchUser(tenant.id);
                        setActiveTenantContext(tenant.id, user.property_id);
                        window.location.reload();
                      } catch (error) {
                        console.error(error);
                      }
                    }}
                  >
                    {tenant.name}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>No tenants found</DropdownMenuItem>
              )}
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
