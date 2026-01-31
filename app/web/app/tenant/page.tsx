"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TenantNavbar } from "@/components/tenant/tenant-navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Calendar } from "lucide-react";
import { fetchIssues, formatDate, mapIssueStatus } from "@/lib/api";

type IssueStatus = "Pending" | "Approved" | "In Progress" | "Completed";

interface SubmittedIssue {
  id: string;
  summary: string;
  status: IssueStatus;
  dateSubmitted: string;
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
    default:
      return "";
  }
}

const faqs = [
  {
    question: "How long do repairs typically take?",
    answer: "Most repairs are addressed within 3-5 business days. Emergency issues like no heat or water leaks are prioritized and typically resolved within 24 hours.",
  },
  {
    question: "How will I be notified about my issue status?",
    answer: "You'll receive notifications in the app when there are updates to your issues. Click the bell icon in the top navigation to see all your notifications.",
  },
  {
    question: "Can I track my issue after reporting?",
    answer: "Yes! Your submitted issues are listed on this page with their current status. Click the chat icon to continue the conversation about any issue.",
  },
  {
    question: "What if I need to cancel or reschedule a repair?",
    answer: "Contact your landlord through the app or reach out to the assigned vendor directly. You can find contact information in your issue details.",
  },
];

export default function TenantHomePage() {
  const router = useRouter();
  const tenantId = process.env.NEXT_PUBLIC_DEMO_TENANT_ID;
  const [submittedIssues, setSubmittedIssues] = useState<SubmittedIssue[]>([]);

  const handleChatClick = (issueId: string) => {
    router.push(`/tenant/report?chat=${issueId}`);
  };

  useEffect(() => {
    let isMounted = true;
    const loadIssues = async () => {
      if (!tenantId) {
        setSubmittedIssues([]);
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
            dateSubmitted: formatDate(issue.created_at),
          }));
        if (isMounted) {
          setSubmittedIssues(tenantIssues);
        }
      } catch (error) {
        if (isMounted) {
          setSubmittedIssues([]);
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
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">
            Welcome back, Sarah
          </h1>
          <p className="mt-1 text-muted-foreground">
            How can we help you today?
          </p>
        </div>

        {/* Report Issue Card */}
        <Card className="bg-card mb-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Report an Issue</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Chat with our AI assistant to report a maintenance problem
                </p>
                <Button asChild className="mt-4">
                  <Link href="/tenant/report">Start Chat</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submitted Issues List */}
        <Card className="bg-card mb-8">
          <CardHeader>
            <CardTitle className="text-foreground">Your Submitted Issues</CardTitle>
            <CardDescription>Track the status of your maintenance requests</CardDescription>
          </CardHeader>
          <CardContent>
            {submittedIssues.length > 0 ? (
              <div className="divide-y divide-border">
                {submittedIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{issue.summary}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <Badge className={getStatusColor(issue.status)}>
                          {issue.status}
                        </Badge>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {issue.dateSubmitted}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-4 shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() => handleChatClick(issue.id)}
                      title="Continue chat"
                    >
                      <MessageSquare className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No issues reported yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Frequently Asked Questions</CardTitle>
            <CardDescription>Quick answers to common questions</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left text-foreground">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
