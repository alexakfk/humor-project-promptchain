"use client";

import { MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Caption } from "@/lib/types";

interface CaptionResultsProps {
  captions: Caption[];
}

export function CaptionResults({ captions }: CaptionResultsProps) {
  if (captions.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-medium">
          Generated Captions
          <Badge variant="secondary" className="ml-2">
            {captions.length}
          </Badge>
        </h3>
      </div>

      <div className="space-y-2">
        {captions.map((caption, i) => (
          <Card key={caption.id || i}>
            <CardContent className="py-3">
              <p className="text-sm">{caption.content ?? "—"}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
