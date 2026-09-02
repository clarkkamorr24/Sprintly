export const RESERVED_SLUGS: readonly string[] = [
  "account",
  "api",
  "auth",
  "invitations",
  "onboarding",
  "sign-in",
  "sign-up",
  "workspaces",
];

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug);
}

export interface RouteSlugs {
  readonly workspaceSlug?: string;
  readonly projectSlug?: string;
  readonly section?: string;
}

const ROOT_PATH = /^\/([^/]+)(?:\/([^/]+))?(?:\/([^/]+))?(?:\/([^/]+))?/;

export function parseRoute(pathname: string): RouteSlugs {
  const match = ROOT_PATH.exec(pathname);
  if (!match) return {};

  const [, first, second, third, fourth] = match;
  if (!first || isReservedSlug(first)) return {};

  if (second === "projects" && third) {
    return { workspaceSlug: first, projectSlug: third, section: fourth };
  }

  return { workspaceSlug: first, section: second };
}

export function workspacePath(workspaceSlug: string, section?: string): string {
  return section ? `/${workspaceSlug}/${section}` : `/${workspaceSlug}`;
}

export function projectPath(
  workspaceSlug: string,
  projectSlug: string,
  section: string
): string {
  return `/${workspaceSlug}/projects/${projectSlug}/${section}`;
}
