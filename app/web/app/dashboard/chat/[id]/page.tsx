"use client";

import React from "react"

import { useState, useRef, useEffect, useCallback } from "react";
import { use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { 
  ChevronLeft, 
  Building2, 
  Send, 
  Bot, 
  User,
  Crown,
  AlertCircle,
  Calendar
} from "lucide-react";
import { fetchIssueMessages, fetchIssues, formatDate, mapIssueStatus, postIssueMessage } from "@/lib/api";

type MessageSender = "tenant" | "ai" | "landlord";

interface ChatMessage {
  id: string;
  content: string;
  imageBase64?: string | null;
  sender: MessageSender;
  senderName: string;
  timestamp: Date;
}

interface IssueDetails {
  id: string;
  summary: string;
  status: string;
  tenantName: string;
  dateReported: string;
  urgency: string;
}

function getSenderIcon(sender: MessageSender) {
  switch (sender) {
    case "tenant":
      return <User className="h-4 w-4" />;
    case "ai":
      return <Bot className="h-4 w-4" />;
    case "landlord":
      return <Crown className="h-4 w-4" />;
  }
}

function getSenderColor(sender: MessageSender) {
  switch (sender) {
    case "tenant":
      return "bg-muted text-muted-foreground";
    case "ai":
      return "bg-primary/10 text-primary";
    case "landlord":
      return "bg-success/10 text-success";
  }
}

function getUrgencyColor(urgency: string) {
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

export default function LandlordChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [issue, setIssue] = useState<IssueDetails>({
    id,
    summary: "Loading...",
    status: "Pending",
    tenantName: "Tenant",
    dateReported: "-",
    urgency: "Medium",
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const tenantId = process.env.NEXT_PUBLIC_DEMO_TENANT_ID;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [apiIssues, apiMessages] = await Promise.all([
          fetchIssues(),
          fetchIssueMessages(id),
        ]);
        const apiIssue = apiIssues.find((item) => item.id === id);
        if (apiIssue && isMounted) {
          setIssue({
            id: apiIssue.id,
            summary: apiIssue.summary,
            status: mapIssueStatus(apiIssue.status),
            tenantName: `Tenant ${apiIssue.tenant_id.slice(0, 6)}`,
            dateReported: formatDate(apiIssue.created_at),
            urgency:
              apiIssue.category === "plumbing" ||
              apiIssue.category === "heating" ||
              apiIssue.category === "electrical"
                ? "High"
                : "Medium",
          });
        }
        if (isMounted) {
          const mappedMessages: ChatMessage[] = apiMessages.map((message) => ({
            id: message.id,
            content: message.content,
            imageBase64: message.image_base64 ?? null,
            sender:
              message.role === "assistant"
                ? "ai"
                : message.role === "landlord"
                  ? "landlord"
                  : "tenant",
            senderName:
              message.role === "assistant"
                ? "ProCo AI"
                : message.role === "landlord"
                  ? "Property Manager"
                  : "Tenant",
            timestamp: new Date(message.created_at),
          }));
          setMessages(mappedMessages);
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          setMessages([]);
          setLoading(false);
        }
        console.error(error);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    if (!tenantId) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          content: "Missing tenant ID. Set NEXT_PUBLIC_DEMO_TENANT_ID to reply.",
          sender: "ai",
          senderName: "System",
          timestamp: new Date(),
        },
      ]);
      setInputValue("");
      return;
    }

    const draft = inputValue.trim();
    setInputValue("");

    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`,
      content: draft,
      imageBase64: null,
      sender: "landlord",
      senderName: "Property Manager",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, optimistic]);

    postIssueMessage(id, { tenant_id: tenantId, content: draft })
      .then((saved) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === optimistic.id
              ? {
                  ...msg,
                  id: saved.id,
                  timestamp: new Date(saved.created_at),
                }
              : msg
          )
        );
      })
      .catch(() => {
        setMessages((prev) => prev.filter((msg) => msg.id !== optimistic.id));
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            content: "Could not send message. Please try again.",
            sender: "ai",
            senderName: "System",
            timestamp: new Date(),
          },
        ]);
      });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (value: Date | string) => {
    const date = value instanceof Date ? value : new Date(value);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (value: Date | string) => {
    const date = value instanceof Date ? value : new Date(value);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <header className="flex h-14 items-center gap-4 border-b border-border bg-card px-4">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-1"
          >
            <Link href="/dashboard">
              <ChevronLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <div className="flex items-center gap-2 ml-auto">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">ProCo</span>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Chat Area */}
          <div className="flex flex-1 flex-col min-w-0">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="mx-auto max-w-3xl space-y-4">
                {loading && (
                  <div className="text-sm text-muted-foreground">Loading chat...</div>
                )}
                {!loading && messages.length === 0 && (
                  <div className="text-sm text-muted-foreground">No messages yet.</div>
                )}
                {messages.map((message, index) => {
                  const showDate = index === 0 || 
                    formatDate(messages[index - 1].timestamp) !== formatDate(message.timestamp);
                  
                  return (
                    <div key={message.id}>
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                            {formatDate(message.timestamp)}
                          </span>
                        </div>
                      )}
                      <div className={cn(
                        "flex gap-3",
                        message.sender === "landlord" && "flex-row-reverse"
                      )}>
                        <Avatar className={cn("h-8 w-8 shrink-0", getSenderColor(message.sender))}>
                          <AvatarFallback className="bg-transparent">
                            {getSenderIcon(message.sender)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "flex flex-col max-w-[75%]",
                          message.sender === "landlord" && "items-end"
                        )}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-foreground">
                              {message.senderName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                          <div className={cn(
                            "rounded-lg px-4 py-2.5 text-sm",
                            message.sender === "tenant" && "bg-muted text-foreground",
                            message.sender === "ai" && "bg-primary/5 text-foreground border border-primary/10",
                            message.sender === "landlord" && "bg-primary text-primary-foreground"
                          )}>
                            {message.imageBase64 && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <button type="button" className="mb-2">
                                    <img
                                      src={message.imageBase64}
                                      alt="Tenant upload"
                                      className="max-h-72 rounded-md object-cover"
                                    />
                                  </button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl">
                                  <img
                                    src={message.imageBase64}
                                    alt="Tenant upload full size"
                                    className="max-h-[75vh] w-full object-contain"
                                  />
                                </DialogContent>
                              </Dialog>
                            )}
                            {message.content}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t border-border bg-card p-4">
              <div className="mx-auto max-w-3xl">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a reply to the tenant..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1"
                  />
                  <Button onClick={handleSend} disabled={!inputValue.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Issue Details Sidebar */}
          <aside className="hidden lg:flex w-80 flex-col border-l border-border bg-card">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Issue Details</h3>
            </div>
            <div className="p-4 space-y-4">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Issue</p>
                      <p className="text-sm font-medium text-foreground">{issue.summary}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Tenant</p>
                      <p className="text-sm font-medium text-foreground">{issue.tenantName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Date Reported</p>
                      <p className="text-sm font-medium text-foreground">{issue.dateReported}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Badge className={getUrgencyColor(issue.urgency)}>
                      {issue.urgency} Urgency
                    </Badge>
                    <Badge variant="outline">
                      {issue.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-2">Message Legend:</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Avatar className={cn("h-5 w-5", getSenderColor("tenant"))}>
                      <AvatarFallback className="bg-transparent text-[10px]">
                        <User className="h-3 w-3" />
                      </AvatarFallback>
                    </Avatar>
                    <span>Tenant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Avatar className={cn("h-5 w-5", getSenderColor("ai"))}>
                      <AvatarFallback className="bg-transparent text-[10px]">
                        <Bot className="h-3 w-3" />
                      </AvatarFallback>
                    </Avatar>
                    <span>AI Agent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Avatar className={cn("h-5 w-5", getSenderColor("landlord"))}>
                      <AvatarFallback className="bg-transparent text-[10px]">
                        <Crown className="h-3 w-3" />
                      </AvatarFallback>
                    </Avatar>
                    <span>Landlord</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
