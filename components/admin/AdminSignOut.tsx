"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";

export function AdminSignOut() {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="mt-2 w-full justify-start px-2"
      onClick={() => signOut({ callbackUrl: `${window.location.origin}/admin/login` })}
    >
      Sign out
    </Button>
  );
}
