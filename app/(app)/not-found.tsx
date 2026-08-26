import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
      <EmptyState
        title="Not found"
        description="This page does not exist, or you do not have access to it."
        action={
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/">Back to your workspaces</Link>}
          />
        }
      />
    </main>
  );
}
