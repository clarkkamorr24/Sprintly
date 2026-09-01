"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { completeOnboardingAction } from "@/app/actions/onboarding-actions";
import { inviteMemberAction } from "@/app/actions/invitation-actions";
import { createProjectAction } from "@/app/actions/project-actions";
import { updateWorkspaceAction } from "@/app/actions/workspace-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PROJECT_COLORS } from "@/lib/constants";
import { WorkspaceRole } from "@/lib/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { SprintlyMark } from "@/components/shared/sprintly-mark";

const STEPS = ["Welcome", "Workspace", "Project", "Invite"] as const;

interface OnboardingFlowProps {
  readonly userName: string;
  readonly workspaceId: string;
  readonly workspaceSlug: string;
  readonly workspaceName: string;
}

interface StepProps {
  readonly title: string;
  readonly description: string;
  readonly direction: 1 | -1;
  readonly children?: React.ReactNode;
  readonly actions: React.ReactNode;
}

function Step({ title, description, direction, children, actions }: StepProps) {
  return (
    <div
      className={cn(
        "animate-in fade-in duration-200 ease-out",
        direction === 1 ? "slide-in-from-right-3" : "slide-in-from-left-3"
      )}
    >
      <h1 className="mb-1 text-[25px]">{title}</h1>
      <p className="mb-4.5 text-[13px] text-[color-mix(in_srgb,var(--sp-text)_65%,transparent)]">
        {description}
      </p>
      {children}
      <div className="flex gap-2">{actions}</div>
    </div>
  );
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
  const [direction, setDirection] = useState<1 | -1>(1);
  const [name, setName] = useState(workspaceName);
  const [projectName, setProjectName] = useState("");
  const [emails, setEmails] = useState("");
  const [error, setError] = useState<string | null>(null);

  const goTo = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const finish = () => {
    startTransition(async () => {
      const result = await completeOnboardingAction();

      if (!result.success) {
        setError(result.error.message);
        return;
      }

      router.replace(`/${workspaceSlug}`);
      router.refresh();
    });
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

      goTo(2);
    });
  };

  const createProject = () => {
    const trimmed = projectName.trim();
    if (!trimmed) {
      goTo(3);
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

      goTo(3);
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
    <div className="w-full max-w-[460px] animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
      <div className="mb-5.5 flex items-center gap-2">
        <SprintlyMark />
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
              className="block h-1 overflow-hidden bg-(--sp-neutral-300)"
            >
              <span
                className={cn(
                  "block h-full origin-left bg-(--sp-accent) transition-transform duration-300 ease-out",
                  index <= step ? "scale-x-100" : "scale-x-0"
                )}
              />
            </span>
          </li>
        ))}
      </ol>

      <div className="border border-(--sp-neutral-300) bg-(--sp-neutral-100) p-5.5">
        {step === 0 ? (
          <Step
            key="welcome"
            title="Welcome to Sprintly"
            direction={direction}
            description={`Hi ${userName.split(" ")[0]} — let's set up your workspace. It takes about a minute.`}
            actions={
              <Button
                className="w-full justify-center"
                onClick={() => goTo(1)}
              >
                Get started
              </Button>
            }
          />
        ) : null}

        {step === 1 ? (
          <Step
            key="workspace"
            title="Name your workspace"
            direction={direction}
            description="A workspace holds your projects, sprints and team."
            actions={
              <>
                <Button
                  variant="outline"
                  className="flex-1 justify-center"
                  onClick={() => goTo(2)}
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
              </>
            }
          >
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
          </Step>
        ) : null}

        {step === 2 ? (
          <Step
            key="project"
            title="Create your first project"
            direction={direction}
            description="Projects get a Kanban board with default columns."
            actions={
              <>
                <Button
                  variant="outline"
                  className="flex-1 justify-center"
                  onClick={() => goTo(3)}
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
              </>
            }
          >
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
          </Step>
        ) : null}

        {step === 3 ? (
          <Step
            key="invite"
            title="Invite your team"
            direction={direction}
            description="Add teammate emails, separated by commas. You can always do this later."
            actions={
              <>
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
              </>
            }
          >
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
          </Step>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="mt-4 animate-in fade-in text-sm text-(--sp-accent-700) duration-150"
          >
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
