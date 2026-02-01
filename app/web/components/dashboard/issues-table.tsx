"use client";

import * as React from "react";

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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { sendVendorRequest } from "@/lib/api";

type VendorOption = {
  id: string;
  name: string;
  email: string | null;
  hourly_rate: number;
};

export type IssueStatus =
  | "Pending"
  | "Approved"
  | "In Progress"
  | "Completed"
  | "Rejected"
  | "Not Enough Budget";
export type IssueUrgency = "Low" | "Medium" | "High";

export interface Issue {
  id: string;
  propertyId: string;
  propertyAddress: string;
  summary: string;
  description: string;
  category: string;
  dateReported: string;
  dateAppointment?: string;
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
  vendors: VendorOption[];
  walletRemainingByProperty: Record<string, number>;
  suggestedVendorsByIssue: Record<string, VendorOption[]>;
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
  vendors,
  walletRemainingByProperty,
  suggestedVendorsByIssue,
  loading,
}: IssuesTableProps) {
  const [selectedVendors, setSelectedVendors] = React.useState<Record<string, string[]>>(
    {}
  );
  const [reportOpen, setReportOpen] = React.useState(false);
  const [activeIssue, setActiveIssue] = React.useState<Issue | null>(null);
  const [page, setPage] = React.useState(1);
  const pageSize = 7;
  const totalPages = Math.max(1, Math.ceil(issues.length / pageSize));
  const pagedIssues = issues.slice((page - 1) * pageSize, page * pageSize);

  React.useEffect(() => {
    setSelectedVendors((prev) => {
      const next = { ...prev };
      issues.forEach((issue) => {
        if (next[issue.id] && next[issue.id].length > 0) {
          return;
        }
        const remaining = walletRemainingByProperty[issue.propertyId] ?? 0;
        const suggested = suggestedVendorsByIssue[issue.id] ?? [];
        const options = suggested.filter((vendor) => vendor.hourly_rate <= remaining);
        if (options.length > 0) {
          next[issue.id] = [options[0].id];
        }
      });
      return next;
    });
  }, [issues, walletRemainingByProperty, suggestedVendorsByIssue]);

  React.useEffect(() => {
    setPage(1);
  }, [issues.length]);

  const toggleVendor = (issueId: string, vendorId: string) => {
    setSelectedVendors((prev) => {
      const current = prev[issueId] ?? [];
      return {
        ...prev,
        [issueId]: current.includes(vendorId)
          ? current.filter((id) => id !== vendorId)
          : [...current, vendorId],
      };
    });
  };

  const handleVendorRequest = async (issueId: string, propertyId: string) => {
    const selected = selectedVendors[issueId] ?? [];
    if (selected.length === 0) {
      window.alert("Select at least one vendor before sending a request.");
      return;
    }
    const vendorList = vendors.filter((vendor) => selected.includes(vendor.id));
    const missingEmail = vendorList.some((vendor) => !vendor.email);
    if (missingEmail) {
      window.alert("One or more selected vendors are missing an email address.");
      return;
    }
    const confirmed = window.confirm(
      "Do you want to send a vendor request email for this issue?"
    );
    if (!confirmed) return;

    try {
      await Promise.all(
        vendorList.map((vendor) => sendVendorRequest(issueId, vendor.id))
      );
      window.alert("Vendor request sent.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Vendor request failed.";
      window.alert(message);
    }
  };
  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">ID</TableHead>
              <TableHead className="text-muted-foreground">Date Reported</TableHead>
              <TableHead className="text-muted-foreground">Date of Appointment</TableHead>
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
    <div className="rounded-xl border border-border/70 bg-card/90 shadow-sm overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border/70 bg-muted/40 hover:bg-muted/40">
            <TableHead className="text-muted-foreground font-medium">Property</TableHead>
            <TableHead className="text-muted-foreground font-medium">Date Reported</TableHead>
            <TableHead className="text-muted-foreground font-medium">Date of Appointment</TableHead>
            <TableHead className="text-muted-foreground font-medium">Tenant</TableHead>
            <TableHead className="text-muted-foreground font-medium">Vendor</TableHead>
            <TableHead className="text-muted-foreground font-medium">Cost</TableHead>
            <TableHead className="text-muted-foreground font-medium">Urgency</TableHead>
            <TableHead className="text-muted-foreground font-medium">Status</TableHead>
            <TableHead className="text-muted-foreground font-medium">Request</TableHead>
            <TableHead className="text-muted-foreground font-medium">Report</TableHead>
            <TableHead className="text-muted-foreground font-medium text-right">Chat</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagedIssues.map((issue) => (
            <TableRow
              key={issue.id}
              className="border-border hover:bg-muted/50 transition-colors"
            >
              <TableCell className="text-sm text-foreground">
                {issue.propertyAddress}
              </TableCell>
              <TableCell className="text-foreground text-sm">
                {issue.dateReported}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {issue.dateAppointment || "-"}
              </TableCell>
              <TableCell className="text-foreground font-medium">
                {issue.tenantName}
              </TableCell>
              <TableCell className="text-muted-foreground">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-[140px] px-2 text-xs justify-start truncate"
                    >
                      {(() => {
                        const selected = selectedVendors[issue.id] ?? [];
                        const names = vendors
                          .filter((vendor) => selected.includes(vendor.id))
                          .map((vendor) => vendor.name);
                        if (names.length > 0) {
                          return names.join(", ");
                        }
                        const remaining = walletRemainingByProperty[issue.propertyId] ?? 0;
                        const suggested = suggestedVendorsByIssue[issue.id] ?? [];
                        const options = suggested.filter(
                          (vendor) => vendor.hourly_rate <= remaining
                        );
                        return options[0]?.name ?? "Select Vendor";
                      })()}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[200px]">
                    {(() => {
                      const remaining = walletRemainingByProperty[issue.propertyId] ?? 0;
                      const suggested = suggestedVendorsByIssue[issue.id] ?? [];
                      const options = suggested.filter(
                        (vendor) => vendor.hourly_rate <= remaining
                      );
                      if (options.length === 0) {
                        return (
                          <div className="px-2 py-1.5 text-xs text-muted-foreground">
                            No suggested vendors within budget
                          </div>
                        );
                      }
                      return options.map((vendor) => (
                        <DropdownMenuCheckboxItem
                          key={vendor.id}
                          checked={(selectedVendors[issue.id] ?? []).includes(vendor.id)}
                          onCheckedChange={() => toggleVendor(issue.id, vendor.id)}
                        >
                          {vendor.name} (${vendor.hourly_rate}/hr)
                        </DropdownMenuCheckboxItem>
                      ));
                    })()}
                  </DropdownMenuContent>
                </DropdownMenu>
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
                  disabled={issue.status === "Not Enough Budget"}
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
                    <SelectItem value="Not Enough Budget">Not Enough Budget</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 px-2 text-xs"
                  onClick={() => handleVendorRequest(issue.id, issue.propertyId)}
                >
                  Send Vendor Request
                </Button>
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setActiveIssue(issue);
                    setReportOpen(true);
                  }}
                  title="View Report"
                >
                  <Eye className="h-4 w-4" />
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
      <Sheet
        open={reportOpen}
        onOpenChange={(open) => {
          setReportOpen(open);
          if (!open) {
            setActiveIssue(null);
          }
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-lg p-6">
          <SheetHeader>
            <SheetTitle>Issue Report</SheetTitle>
            <SheetDescription>
              Review the issue details before downloading.
            </SheetDescription>
          </SheetHeader>
          {activeIssue && (
            <div className="mt-6 space-y-6 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Summary</p>
                <p className="text-base font-semibold text-foreground leading-relaxed">
                  {activeIssue.summary}
                </p>
                <p className="mt-2 text-muted-foreground leading-relaxed">
                  {activeIssue.description || "No additional details provided."}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Property</p>
                  <p className="text-foreground">{activeIssue.propertyAddress}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Tenant</p>
                  <p className="text-foreground">{activeIssue.tenantName}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Reported</p>
                  <p className="text-foreground">{activeIssue.dateReported}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Appointment
                  </p>
                  <p className="text-foreground">{activeIssue.dateAppointment || "-"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                  <p className="text-foreground">{activeIssue.status}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Suggested Vendor
                  </p>
                  <p className="text-foreground">
                    {(() => {
                      const remaining =
                        walletRemainingByProperty[activeIssue.propertyId] ?? 0;
                      const suggested = suggestedVendorsByIssue[activeIssue.id] ?? [];
                      const withinBudget = suggested.filter(
                        (vendor) => vendor.hourly_rate <= remaining
                      );
                      return withinBudget[0]?.name ?? suggested[0]?.name ?? "Unassigned";
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Cost</p>
                  <p className="text-foreground">${activeIssue.cost.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Urgency</p>
                  <p className="text-foreground">{activeIssue.urgency}</p>
                </div>
              </div>
              <div className="pt-2">
                <Button onClick={() => onDownloadReport(activeIssue.id)}>
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
      <div className="flex items-center justify-between border-t border-border/70 px-4 py-3 text-sm">
        <span className="text-muted-foreground">
          Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, issues.length)} of{" "}
          {issues.length}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
