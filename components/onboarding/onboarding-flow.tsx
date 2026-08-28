"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { inviteMemberAction } from "@/app/actions/invitation-actions";
import { createProjectAction } from "@/app/actions/project-actions";
import { updateWorkspaceAction } from "@/app/actions/workspace-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PROJECT_COLORS } from "@/lib/constants";
import { WorkspaceRole } from "@/lib/generated/prisma/enums";
import { cn } from "@/lib/utils";

const STEPS = ["Welcome", "Workspace", "Project", "Invite"] as const;

interface OnboardingFlowProps {
  readonly userName: string;
  readonly workspaceId: string;
  readonly workspaceSlug: string;
  readonly workspaceName: string;
}

export function OnboardingFlow({
  userName,
  workspaceId,
  workspaceSlug,
  workspaceName,
}: OnboardingFlowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(workspaceName);
  const [projectName, setProjectName] = useState("");
  const [emails, setEmails] = useState("");
  const [error, setError] = useState<string | null>(null);

  const finish = () => {
    router.push(`/workspaces/${workspaceSlug}`);
    router.refresh();
  };

  const saveWorkspace = () => {
    setError(null);
    startTransition(async () => {
      const result = await updateWorkspaceAction({
        workspaceId,
        name: name.trim(),
        description: "",
      });

      if (!result.success) {
        setError(result.error.message);
        return;
      }

      setStep(2);
    });
  };

  const createProject = () => {
    const trimmed = projectName.trim();
    if (!trimmed) {
      setStep(3);
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await createProjectAction({
        workspaceId,
        name: trimmed,
        description: "",
        color: PROJECT_COLORS[0],
      });

      if (!result.success) {
        setError(result.error.message);
        return;
      }

      setStep(3);
    });
  };

  const sendInvites = () => {
    const addresses = emails
      .split(/[\s,]+/)
      .map((value) => value.trim())
      .filter(Boolean);

    if (addresses.length === 0) {
      finish();
      return;
    }

    setError(null);
    startTransition(async () => {
      let sent = 0;

      for (const email of addresses) {
        const result = await inviteMemberAction({
          workspaceId,
          email,
          role: WorkspaceRole.MEMBER,
        });
        if (result.success) sent += 1;
      }

      if (sent > 0) {
        toast.success(`Sent ${sent} ${sent === 1 ? "invite" : "invites"}.`);
      }
      finish();
    });
  };

  return (
    <div className="w-full max-w-[460px]">
      <div className="mb-5.5 flex items-center gap-2">
        <span aria-hidden className="block size-5 bg-(--sp-accent)" />
        <span className="text-[18px] font-extrabold tracking-[-0.02em]">
          Sprintly
        </span>
      </div>

      <ol className="mb-4 flex gap-1" aria-label="Onboarding progress">
        {STEPS.map((label, index) => (
          <li key={label} className="flex-1">
            <span className="sr-only">
              {label}
              {index === step ? " (current step)" : ""}
            </span>
            <span
              aria-hidden
              className={cn(
                "block h-1",
                index <= step ? "bg-(--sp-accent)" : "bg-(--sp-neutral-300)"
              )}
            />
          </li>
        ))}
      </ol>

      <div className="border border-(--sp-neutral-300) bg-(--sp-neutral-100) p-5.5">
        {step === 0 ? (
          <>
            <h1 className="mb-1 text-[25px]">Welcome to Sprintly</h1>
            <p className="mb-4.5 text-[13px] text-[color-mix(in_srgb,var(--sp-text)_65%,transparent)]">
              Hi {userName.split(" ")[0]} — let&apos;s set up your workspace. It
              takes about a minute.
            </p>
            <Button className="w-full justify-center" onClick={() => setStep(1)}>
              Get started
            </Button>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <h1 className="mb-1 text-[25px]">Name your workspace</h1>
            <p className="mb-4.5 text-[13px] text-[color-mix(in_srgb,var(--sp-text)_65%,transparent)]">
              A workspace holds your projects, sprints and team.
            </p>
            <div className="mb-4 space-y-2">
              <Label htmlFor="ws-name">Workspace name</Label>
              <Input
                id="ws-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Acme Engineering"
                disabled={isPending}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 justify-center"
                onClick={() => setStep(2)}
                disabled={isPending}
              >
                Skip
              </Button>
              <Button
                className="flex-1 justify-center"
                onClick={saveWorkspace}
                disabled={isPending || !name.trim()}
              >
                {isPending ? "Saving…" : "Continue"}
              </Button>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h1 className="mb-1 text-[25px]">Create your first project</h1>
            <p className="mb-4.5 text-[13px] text-[color-mix(in_srgb,var(--sp-text)_65%,transparent)]">
              Projects get a Kanban board with default columns.
            </p>
            <div className="mb-4 space-y-2">
              <Label htmlFor="project-name">Project name</Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="Website Redesign"
                disabled={isPending}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 justify-center"
                onClick={() => setStep(3)}
                disabled={isPending}
              >
                Skip
              </Button>
              <Button
                className="flex-1 justify-center"
                onClick={createProject}
                disabled={isPending}
              >
                {isPending ? "Creating…" : "Continue"}
              </Button>
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <h1 className="mb-1 text-[25px]">Invite your team</h1>
            <p className="mb-4.5 text-[13px] text-[color-mix(in_srgb,var(--sp-text)_65%,transparent)]">
              Add teammate emails, separated by commas. You can always do this
              later.
            </p>
            <div className="mb-4 space-y-2">
              <Label htmlFor="invite-emails">Emails</Label>
              <Input
                id="invite-emails"
                value={emails}
                onChange={(event) => setEmails(event.target.value)}
                placeholder="ana@acme.com, sam@acme.com"
                disabled={isPending}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 justify-center"
                onClick={finish}
                disabled={isPending}
              >
                Skip
              </Button>
              <Button
                className="flex-1 justify-center"
                onClick={sendInvites}
                disabled={isPending}
              >
                {isPending ? "Sending…" : "Finish"}
              </Button>
            </div>
          </>
        ) : null}

        {error ? (
          <p role="alert" className="mt-4 text-sm text-(--sp-accent-700)">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
