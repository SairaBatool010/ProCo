"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Download } from "lucide-react";

export type IssueStatus = "Pending" | "Approved" | "In Progress" | "Completed" | "Rejected";
export type IssueUrgency = "Low" | "Medium" | "High";

export interface Issue {
  id: string;
  summary: string;
  dateReported: string;
  dateResolved?: string;
  tenantName: string;
  vendor: string;
  cost: number;
  urgency: IssueUrgency;
  status: IssueStatus;
}

interface IssuesTableProps {
  issues: Issue[];
  onStatusChange: (id: string, status: IssueStatus) => void;
  onChat: (id: string) => void;
  onDownloadReport: (id: string) => void;
  loading?: boolean;
}

function getUrgencyColor(urgency: IssueUrgency) {
  switch (urgency) {
    case "Low":
      return "bg-success/10 text-success border-success/20";
    case "Medium":
      return "bg-warning/10 text-warning-foreground border-warning/20";
    case "High":
      return "bg-destructive/10 text-destructive border-destructive/20";
    default:
      return "";
  }
}

export function IssuesTable({
  issues,
  onStatusChange,
  onChat,
  onDownloadReport,
  loading,
}: IssuesTableProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">ID</TableHead>
              <TableHead className="text-muted-foreground">Date Reported</TableHead>
              <TableHead className="text-muted-foreground">Date Resolved</TableHead>
              <TableHead className="text-muted-foreground">Tenant</TableHead>
              <TableHead className="text-muted-foreground">Vendor</TableHead>
              <TableHead className="text-muted-foreground">Cost</TableHead>
              <TableHead className="text-muted-foreground">Urgency</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Report</TableHead>
              <TableHead className="text-muted-foreground text-right">Chat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i} className="border-border">
                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell><Skeleton className="h-8 w-28" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground">No maintenance issues to display.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground font-medium">ID</TableHead>
            <TableHead className="text-muted-foreground font-medium">Date Reported</TableHead>
            <TableHead className="text-muted-foreground font-medium">Date Resolved</TableHead>
            <TableHead className="text-muted-foreground font-medium">Tenant</TableHead>
            <TableHead className="text-muted-foreground font-medium">Vendor</TableHead>
            <TableHead className="text-muted-foreground font-medium">Cost</TableHead>
            <TableHead className="text-muted-foreground font-medium">Urgency</TableHead>
            <TableHead className="text-muted-foreground font-medium">Status</TableHead>
            <TableHead className="text-muted-foreground font-medium">Report</TableHead>
            <TableHead className="text-muted-foreground font-medium text-right">Chat</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {issues.map((issue) => (
            <TableRow
              key={issue.id}
              className="border-border hover:bg-muted/50 transition-colors"
            >
              <TableCell className="font-mono text-sm text-muted-foreground">
                #{issue.id}
              </TableCell>
              <TableCell className="text-foreground text-sm">
                {issue.dateReported}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {issue.dateResolved || "-"}
              </TableCell>
              <TableCell className="text-foreground font-medium">
                {issue.tenantName}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {issue.vendor}
              </TableCell>
              <TableCell className="text-foreground">
                ${issue.cost.toLocaleString()}
              </TableCell>
              <TableCell>
                <Badge className={getUrgencyColor(issue.urgency)}>
                  {issue.urgency}
                </Badge>
              </TableCell>
              <TableCell>
                <Select
                  value={issue.status}
                  onValueChange={(value) => onStatusChange(issue.id, value as IssueStatus)}
                >
                  <SelectTrigger className="w-[130px] h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => onDownloadReport(issue.id)}
                  title="Download Report"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-primary/10"
                    onClick={() => onChat(issue.id)}
                    title="Chat with tenant"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
