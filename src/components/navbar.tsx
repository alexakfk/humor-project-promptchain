"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/client";

export function Navbar() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center px-4">
        <Link href="/humor-flavors" className="flex items-center gap-2 font-semibold">
          <Zap className="h-5 w-5" />
          <span>Humor Flavors</span>
        </Link>

        <nav className="ml-8 flex items-center gap-4 text-sm">
          <Link
            href="/humor-flavors"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Flavors
          </Link>
          <Link
            href="/captions"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Captions
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
