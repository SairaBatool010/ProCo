"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LandlordNavbar } from "@/components/landlord/landlord-navbar";
import { StatsCard } from "@/components/dashboard/stats-card";
import { StatusChart } from "@/components/dashboard/status-chart";
import { PropertyMap } from "@/components/dashboard/property-map";
import { IssuesTable, type Issue, type IssueStatus } from "@/components/dashboard/issues-table";
import { LayoutDashboard, AlertCircle, Clock, DollarSign, CheckCircle } from "lucide-react";
import { approveIssue, fetchIssues, fetchVendors, formatDate, mapIssueStatus, rejectIssue } from "@/lib/api";

const sampleProperties = [
  {
    id: "1",
    name: "Alster Residences",
    address: "Jungfernstieg 12, Hamburg",
    activeIssues: 3,
    position: { x: 30, y: 35 },
  },
  {
    id: "2",
    name: "Speicherstadt Lofts",
    address: "Brooktorkai 5, Hamburg",
    activeIssues: 1,
    position: { x: 55, y: 55 },
  },
  {
    id: "3",
    name: "HafenCity Plaza",
    address: "Am Sandtorkai 48, Hamburg",
    activeIssues: 0,
    position: { x: 75, y: 45 },
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadIssues = async () => {
      try {
        const [apiIssues, apiVendors] = await Promise.all([
          fetchIssues(),
          fetchVendors(),
        ]);
        const vendorMap = new Map(apiVendors.map((vendor) => [vendor.id, vendor.name]));
        const mappedIssues: Issue[] = apiIssues.map((issue) => ({
          id: issue.id,
          summary: issue.summary,
          dateReported: formatDate(issue.created_at),
          tenantName: `Tenant ${issue.tenant_id.slice(0, 6)}`,
          vendor: issue.vendor_id ? vendorMap.get(issue.vendor_id) ?? "Unassigned" : "Unassigned",
          cost: issue.estimated_cost ?? 0,
          urgency:
            issue.category === "plumbing" ||
            issue.category === "heating" ||
            issue.category === "electrical"
              ? "High"
              : "Medium",
          status: mapIssueStatus(issue.status) as IssueStatus,
        }));
        if (isMounted) {
          setIssues(mappedIssues);
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          setIssues([]);
          setLoading(false);
        }
        console.error(error);
      }
    };

    loadIssues();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleStatusChange = async (id: string, status: IssueStatus) => {
    setIssues((prev) =>
      prev.map((issue) =>
        issue.id === id ? { ...issue, status } : issue
      )
    );
    if (status === "Approved") {
      await approveIssue(id);
    }
    if (status === "Rejected") {
      await rejectIssue(id);
    }
  };

  const handleChat = (id: string) => {
    // Navigate to landlord chat page with issue id
    router.push(`/dashboard/chat/${id}`);
  };

  const handleDownloadReport = (id: string) => {
    // In production: trigger file download
    const issue = issues.find((i) => i.id === id);
    if (issue) {
      // Simulate download - in production this would download a real PDF
      const reportData = `Issue Report #${id}\n\nSummary: ${issue.summary}\nTenant: ${issue.tenantName}\nDate Reported: ${issue.dateReported}\nStatus: ${issue.status}\nVendor: ${issue.vendor}\nCost: $${issue.cost}`;
      const blob = new Blob([reportData], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `issue-report-${id}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Calculate stats
  const openIssues = issues.filter((i) => i.status !== "Completed" && i.status !== "Rejected").length;
  const pendingApproval = issues.filter((i) => i.status === "Pending").length;
  const completedIssues = issues.filter((i) => i.status === "Completed").length;
  const totalSpend = issues
    .filter((i) => i.status === "Completed" || i.status === "Approved" || i.status === "In Progress")
    .reduce((sum, i) => sum + i.cost, 0);

  // Chart data
  const statusChartData = [
    { status: "Pending", count: issues.filter(i => i.status === "Pending").length },
    { status: "Approved", count: issues.filter(i => i.status === "Approved").length },
    { status: "In Progress", count: issues.filter(i => i.status === "In Progress").length },
    { status: "Completed", count: issues.filter(i => i.status === "Completed").length },
  ];

  return (
    <div className="min-h-screen bg-background">
      <LandlordNavbar notificationCount={pendingApproval} />
      <main className="container px-4 py-8 md:px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Landlord Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage and approve tenant maintenance requests
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <StatsCard
            title="Open Issues"
            value={openIssues}
            icon={AlertCircle}
            loading={loading}
          />
          <StatsCard
            title="Pending Approval"
            value={pendingApproval}
            icon={Clock}
            loading={loading}
          />
          <StatsCard
            title="Completed"
            value={completedIssues}
            icon={CheckCircle}
            loading={loading}
          />
          <StatsCard
            title="Total Spend"
            value={`$${totalSpend.toLocaleString()}`}
            icon={DollarSign}
            loading={loading}
          />
        </div>

        {/* Charts and Map Row */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <StatusChart data={statusChartData} />
          <PropertyMap properties={sampleProperties} />
        </div>

        {/* Issues Table */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            Maintenance Requests
          </h2>
          <IssuesTable
            issues={issues}
            onStatusChange={handleStatusChange}
            onChat={handleChat}
            onDownloadReport={handleDownloadReport}
            loading={loading}
          />
        </div>
      </main>
    </div>
  );
}
