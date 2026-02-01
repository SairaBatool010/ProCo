"use client";

import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Bot, Crown, User } from "lucide-react";

export interface Message {
  id: string;
  content: string;
  imageBase64?: string | null;
  role: "user" | "assistant" | "landlord";
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isLandlord = message.role === "landlord";

  return (
    <div
      className={cn(
        "flex gap-3 p-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : isLandlord ? (
          <Crown className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>
      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-1",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-lg px-4 py-2.5",
            isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
          )}
        >
          {message.imageBase64 && (
            <Dialog>
              <DialogTrigger asChild>
                <button type="button" className="mb-2">
                  <img
                    src={message.imageBase64}
                    alt="Uploaded"
                    className="max-h-64 rounded-md object-cover"
                  />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <img
                  src={message.imageBase64}
                  alt="Uploaded full size"
                  className="max-h-[75vh] w-full object-contain"
                />
              </DialogContent>
            </Dialog>
          )}
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
        <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
          {isLandlord && <span className="font-medium">Landlord</span>}
          <span>{formatTime(message.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
