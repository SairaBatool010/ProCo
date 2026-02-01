"use client";

import { useEffect, useState } from "react";
import { TenantNavbar } from "@/components/tenant/tenant-navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Calendar, RefreshCw } from "lucide-react";
import { fetchIssues, formatDate, mapIssueStatus } from "@/lib/api";
import { useActiveTenant } from "@/lib/tenant";

type IssueStatus = "Pending" | "Approved" | "In Progress" | "Completed" | "Rejected";

interface Issue {
  id: string;
  summary: string;
  status: IssueStatus;
  dateReported: string;
  lastUpdated: string;
}

function getStatusVariant(status: IssueStatus) {
  switch (status) {
    case "Pending":
      return "secondary";
    case "Approved":
      return "default";
    case "In Progress":
      return "default";
    case "Completed":
      return "default";
    case "Rejected":
      return "destructive";
    default:
      return "secondary";
  }
}

function getStatusColor(status: IssueStatus) {
  switch (status) {
    case "Pending":
      return "bg-warning/10 text-warning-foreground border-warning/20";
    case "Approved":
      return "bg-info/10 text-info border-info/20";
    case "In Progress":
      return "bg-primary/10 text-primary border-primary/20";
    case "Completed":
      return "bg-success/10 text-success border-success/20";
    case "Rejected":
      return "bg-destructive/10 text-destructive border-destructive/20";
    default:
      return "";
  }
}

export default function TenantHistoryPage() {
  const { tenantId } = useActiveTenant();
  const [issues, setIssues] = useState<Issue[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadIssues = async () => {
      if (!tenantId) {
        setIssues([]);
        return;
      }
      try {
        const apiIssues = await fetchIssues();
        const tenantIssues = apiIssues
          .filter((issue) => issue.tenant_id === tenantId)
          .map((issue) => ({
            id: issue.id,
            summary: issue.summary,
            status: mapIssueStatus(issue.status) as IssueStatus,
            dateReported: formatDate(issue.created_at),
            lastUpdated: formatDate(issue.created_at),
          }));
        if (isMounted) {
          setIssues(tenantIssues);
        }
      } catch (error) {
        if (isMounted) {
          setIssues([]);
        }
        console.error(error);
      }
    };

    loadIssues();
    return () => {
      isMounted = false;
    };
  }, [tenantId]);

  return (
    <div className="min-h-screen bg-background">
      <TenantNavbar />
      <main className="container px-4 py-8 md:px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Issue History</h1>
              <p className="text-sm text-muted-foreground">
                Track the status of your reported issues
              </p>
            </div>
          </div>
        </div>

        {/* Issues List */}
        <div className="space-y-4">
          {issues.map((issue) => (
            <Card key={issue.id} className="bg-card hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-muted-foreground font-mono">
                        #{issue.id}
                      </span>
                      <Badge className={getStatusColor(issue.status)}>
                        {issue.status}
                      </Badge>
                    </div>
                    <h3 className="font-medium text-foreground truncate">
                      {issue.summary}
                    </h3>
                  </div>
                  <div className="flex flex-col md:flex-row gap-4 md:gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Reported: {issue.dateReported}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      <span>Updated: {issue.lastUpdated}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
