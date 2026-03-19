"use client";

import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { HumorFlavor } from "@/lib/types";

interface HumorFlavorCardProps {
  flavor: HumorFlavor & { step_count: number };
  onDelete: (id: number) => void;
}

export function HumorFlavorCard({ flavor, onDelete }: HumorFlavorCardProps) {
  return (
    <Card className="group relative transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <Link href={`/humor-flavors/${flavor.id}`}>
              <CardTitle className="text-lg hover:underline">
                {flavor.slug}
              </CardTitle>
            </Link>
            <CardDescription className="mt-1 line-clamp-2">
              {flavor.description || "No description"}
            </CardDescription>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="shrink-0" />}>
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem render={<Link href={`/humor-flavors/${flavor.id}`} />}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(flavor.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Badge variant="secondary">
            {flavor.step_count} {flavor.step_count === 1 ? "step" : "steps"}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Created {new Date(flavor.created_datetime_utc).toLocaleDateString()}
          </span>
        </div>
      </CardHeader>
    </Card>
  );
}
