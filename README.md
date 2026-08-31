# Sprintly

Multi-user project management and team collaboration app built around a Kanban board.

Next.js 16 (App Router) · React 19 · TypeScript · Prisma 7 · PostgreSQL · Tailwind CSS 4 · shadcn/ui (Base UI)

## How Sprintly works

The journey from signing in to shipping work, in the order you meet it.

### 1. Sign in or register

`/sign-in` asks for your email first, then swaps to a password step that keeps
the address visible. The first step never checks whether an account exists, and
a wrong password and an unknown address give the same message, so the form
cannot be used to discover who has an account.

`/sign-up` creates an account. A password reset link leads to
`/account/password`, which stays reachable even mid-onboarding.

### 2. Onboarding

New accounts land on `/onboarding` and stay there until it is finished — every
other page redirects back to it. Four short steps:

1. **Welcome**
2. **Name your workspace** — skippable, and you can rename later
3. **Create your first project** — optional; gives you a board with default columns
4. **Invite your team** — optional; comma-separated emails

Finishing marks the account as onboarded and drops you into your workspace.
Because that flag lives on the account, it survives refresh, logout and a new
device. People who join through an invitation skip onboarding entirely: they
arrive in a workspace someone else already set up.

### 3. Workspaces

A workspace holds everything — projects, issues, sprints, members and activity
— and is the boundary that keeps teams apart. Data is never shared between
workspaces, and switching workspaces reloads all of it.

You get a workspace by creating one, from the switcher in the sidebar, or by
accepting an invitation to someone else's. URLs use the workspace slug:
`/workspaces/acme-inc/board`.

Roles, strongest first:

| Role       | Can do                                                                          |
| ---------- | ------------------------------------------------------------------------------- |
| **Owner**  | Everything, plus rename or delete the workspace and change member roles         |
| **Admin**  | Invite and remove members, manage projects, boards and labels, delete any issue |
| **Member** | Create and edit issues, comment                                                 |
| **Viewer** | Read only                                                                       |

Whoever creates a workspace is its Owner. Invited people join as Member by
default, and an Owner can change that afterwards.

### 4. Projects and boards

A workspace holds projects, and each project has its own Kanban board with five
columns: **Backlog → To Do → In Progress → Review → Done**.

The sidebar's _Work_ section appears once the workspace has at least one
project, and shows the same project from four angles:

- **Board** — the Kanban view; drag issues between columns
- **Backlog** — every issue grouped by sprint, with unassigned work last
- **Sprints** — the two-pane planner for filling a sprint
- **Issues** — a flat, filterable list of every issue in the workspace

When a workspace has several projects, a project switcher on the Board, Backlog
and Sprints pages picks which one you are looking at, and remembers the choice
per workspace.

### 5. Issues

An issue carries a project key (`WEB-142`), a type (Story, Task, Bug or Epic), a
priority, optional story points, a due date and labels.

- **Create** from a column's "Add issue", or from the Backlog.
- **Open** by clicking the title — the detail opens over the board, so you never
  lose your place.
- **Edit** in that dialog: change the assignee, add subtasks, comment.
- **Move** by dragging the card anywhere on its surface, or through the "Move
  to" menu. Every card also has a keyboard drag handle.
- **Delete** from the card menu, after a confirmation.

**Assignees.** Anyone with permission can assign an issue to any member of the
workspace, including themselves, and change it later from the issue dialog.

**Comments and mentions.** Type `@` and someone's first name to mention them.
Mentions only resolve to people on that project, so nobody outside it can be
pulled in by accident. Authors may edit their own comments; admins may delete
anyone's. Deleting asks for confirmation.

### 6. Sprints

A sprint is a fixed time box with a name, an optional goal, and start and end
dates. It moves through three states:

**Planned → Active → Completed**

- Create a sprint on the Sprints page, then move issues into it from the backlog.
- Starting it makes it Active. Only one sprint can be active at a time, so
  finish the current one first.
- While a sprint is active the board shows a banner: points completed against
  points committed, and days remaining.
- Completing a sprint returns any unfinished issues to the backlog, so nothing
  is silently lost.

### 7. Notifications

The bell in the header shows unread activity. You are notified when someone:

- assigns an issue to you
- moves an issue you are assigned to
- comments on an issue you are involved in
- mentions you in a comment
- invites you to a workspace

You are never notified about your own actions. Clicking a notification opens
what it refers to — an issue notification opens that issue's dialog directly,
rather than a generic board, and an invitation opens the accept page. If the
issue has since been deleted, the dialog says so instead of failing.

### 8. Workspace invitations

An Owner or Admin invites someone by email from the **Team** page. What happens
next depends on whether that address already has an account:

- **Already has one** — they sign in, and accepting adds them to the workspace.
- **New to Sprintly** — they register with the invited address, which is
  pre-filled and read-only, and join automatically once registered.

An invitation is bound to the address it was sent to, so nobody else can accept
it, and it expires after 7 days. Pending invitations can be revoked from the
Team page.

**If the email cannot be delivered** — the invitation is still created and still
valid. The Team page says so and offers a **Copy link** button, so you can send
the link through any channel you like. It carries the same token and stays tied
to the invited address, so its security is unchanged.

### 9. What each role can do

| Action                                      | Owner | Admin | Member | Viewer |
| ------------------------------------------- | :---: | :---: | :----: | :----: |
| View issues and boards                      |   ✓   |   ✓   |   ✓    |   ✓    |
| Create and edit issues                      |   ✓   |   ✓   |   ✓    |        |
| Comment                                     |   ✓   |   ✓   |   ✓    |        |
| Delete any issue                            |   ✓   |   ✓   |        |        |
| Manage projects, boards, sprints and labels |   ✓   |   ✓   |        |        |
| Invite and remove members                   |   ✓   |   ✓   |        |        |
| Change member roles                         |   ✓   |       |        |        |
| Rename or delete the workspace              |   ✓   |       |        |        |

Members can edit and delete the issues they created or are assigned to. Viewers
hold no write permissions at all — not even for issues they created themselves.

## Architecture

Requests flow through explicit layers; each one has a single job.

```
Route Handler / Server Action   entry point: validate input, shape response
    ↓
Service                         business logic, framework-agnostic
    ↓
Repository                      Prisma queries, explicit selects
    ↓
Prisma Client                   PostgreSQL
```

| Path            | Contents                                                               |
| --------------- | ---------------------------------------------------------------------- |
| `app/`          | Routes, layouts, Route Handlers                                        |
| `app/actions/`  | Server Actions — validate, call a service, revalidate                  |
| `components/`   | UI, grouped by feature (`board/`, `workspace/`, `project/`, `shared/`) |
| `hooks/`        | Client behavior, e.g. optimistic board ordering                        |
| `services/`     | Business logic. Never imports `next/server`                            |
| `repositories/` | Data access. All Prisma queries live here                              |
| `schemas/`      | Zod schemas shared by client forms and server validation               |
| `lib/auth/`     | `requireUser()`, workspace/project guards, permission matrix           |
| `lib/db.ts`     | Prisma client singleton                                                |
| `lib/errors.ts` | Typed application errors                                               |
| `types/`        | DTOs and the shared `ApiResponse<T>` contract                          |

### Workspaces are the authorization boundary

`User -> Workspace -> Project -> Sprint -> Issue`. A user belongs to workspaces
through `WorkspaceMember`, never to projects directly; a project is owned by its
workspace, not by whoever created it. Everything workspace-scoped — projects,
sprints, issues, comments, labels, activity — resolves access through that one
membership check.

Roles rank Owner > Admin > Member > Viewer. Viewers hold no write permissions at
all: `canModifyTask` refuses them even for issues they created.

Signing in for the first time provisions the account: the profile is created,
any pending invitation for that email is accepted (preserving its workspace and
role), and if none exists the user gets their own workspace as Owner.

### Invitations

`/invitations/<token>` is public, because a person following an invitation link
may not have an account yet. The page resolves the token server-side and routes
accordingly: an invited address that already has an account goes to `/sign-in`,
one that does not goes to `/sign-up`, both carrying `?next=` back to the
invitation and `?email=` to prefill the address. That field is read-only, and
the submitted value is read from the server-provided prop rather than the input,
so editing the DOM changes nothing.

Invitations are emailed through Supabase Auth — `inviteUserByEmail` for a new
address, a magic link for one that already has an account, both redirecting to
the invitation URL. Supabase's built-in SMTP is rate limited to a handful of
messages per hour, so sending reports whether it actually succeeded: on failure
the inviter sees the reason and the invitation link to share directly, rather
than a false "sent". Configure a custom SMTP provider in Supabase to lift that
limit, and add `<site>/invitations/*` to the Redirect URLs allowlist.

Reporting whether an address has an account is normally an enumeration risk, but
this reply requires the invitation token, which already names that exact
address, so it discloses nothing the caller did not have.

The email is checked before invitation status, so an invitation is only ever
valid for the address it was sent to whatever its state. Accepting is
idempotent: first sign-in already accepts pending invitations for that address,
so a token that is already accepted counts as success when the caller is a
member, and as a conflict only when the membership is genuinely missing.
Expired and unknown tokens render an explanation rather than an error page.

Someone who joins through an invitation lands in a workspace that is already set
up, so provisioning marks them onboarded and skips the setup flow, which only
makes sense for an owner configuring their own workspace.

### Onboarding

`User.onboardedAt` records when setup finished; `NULL` means it has not. The
`(app)` layout redirects to `/onboarding` while it is null, so every
application route is gated in one place rather than per page, and `/onboarding`
redirects the other way once it is set. Because the flag lives on the row and
not in a cookie or client state, it survives refresh, logout and a new device.

`/onboarding` sits outside the `(app)` group so it renders without the sidebar
and header, and so gating it in that layout cannot loop. `/account/password`
stays reachable while onboarding is incomplete, so a password-reset link always
works.

The migration backfills `onboardedAt` from `createdAt` for existing rows, so
nobody who already had an account is sent back through setup.

Step transitions fade and slide in the direction of travel, the progress bar
scales rather than snapping, and a global `prefers-reduced-motion` rule reduces
every animation and transition in the app to near-zero for users who ask for
that.

### Authorization

Every workspace- or project-scoped operation resolves membership from the
authenticated session, never from a client-supplied id. Guards live in
[lib/auth/guards.ts](lib/auth/guards.ts); role capabilities are declared once in
[lib/auth/permissions.ts](lib/auth/permissions.ts) and shared by UI and server.

Unauthorized access to a workspace returns `NOT_FOUND` rather than `FORBIDDEN`,
so ids cannot be probed for existence. Pages route those typed errors through
[lib/page-guard.ts](lib/page-guard.ts), which renders a real 404 instead of a
200 with friendly copy.

`proxy.ts` gates routes at the edge of the request, but it only reads the
session cookie. It is a first line of defense, never the authorization
boundary — every action and page re-checks server-side.

Every workspace-scoped page lives under the workspace slug — `/workspaces/<slug>`
plus `projects`, `board`, `backlog`, `sprints`, `issues`, `team`, `reports`, and
`settings`. There are no project-id URLs; the slug is the only identifier in the
address bar.

Board, Backlog and Sprints belong to a project, so they render the workspace's
_selected_ project, stored per workspace in an `sp_project_<workspaceId>` cookie
and defaulting to the first project. `selectProjectAction` re-checks project
access server-side before writing that cookie, and the selection is validated
against the workspace on every read, so a cookie naming a project in another
workspace is ignored rather than trusted.

Workspace URLs carry the slug, not the UUID: `/workspaces/acme-inc`. The slug is
resolved to the internal id and checked against the caller's membership in a
single query (`requireWorkspaceBySlug`), and every downstream query is scoped by
that resolved id. An unknown slug and a workspace the caller does not belong to
both raise `NotFoundError`, so slugs cannot be probed for existence.

The active workspace is derived from the URL, never from a stored preference or
array position: `/workspaces/<slug>` names it directly and `/projects/<id>`
resolves it through the project's owning workspace.

Layouts do not re-render on client-side navigation within a segment, so the
sidebar and switcher read the slug from `usePathname()` rather than trusting the
value the layout resolved on first render — otherwise switching workspaces
leaves the previous workspace's name in the chrome until a reload. Slugs are
assigned at creation and read-only thereafter, so these URLs stay stable.

A workspace segment is authorized in its layout, which renders above
`loading.tsx`. That ordering matters: once a Suspense boundary starts streaming,
the 200 is already sent and a later `notFound()` can no longer change the
status, so an unauthorized id would render "Not found" under a 200.

Row Level Security is enabled on every workspace-scoped table as
defence-in-depth. Prisma connects as the table owner and therefore bypasses
those policies, so the guards above remain the active enforcement path; the
policies protect anything that reaches Postgres another way — the Supabase
dashboard, PostgREST, or a leaked publishable key. They key off `auth.uid()`
via `is_workspace_member()` and `has_workspace_role()`.

### Authentication

Sign-in is email and password through Supabase Auth, in two steps: `/sign-in`
asks for the email, then swaps to a password step that keeps the address visible
with a Back control and auto-focuses the field.

Step 1 never checks whether an account exists — it only validates the address
format — and an unregistered email produces exactly the same "Incorrect email or
password." as a wrong password, so the form cannot be used to enumerate accounts.
Password reset reports success regardless of whether the address is registered,
for the same reason.

`/sign-up` creates an account, `/account/password` sets a new one from a reset
link, and `/auth/callback` exchanges both confirmation and recovery links for a
session (handling PKCE `code` and `token_hash` flows). `proxy.ts` refreshes the
session on every request so tokens do not expire mid-visit.

Auth sits behind the `AuthProvider` interface in [types/auth.ts](types/auth.ts),
so a different provider means implementing that one interface.

### Kanban board

Task ordering uses sparse integer positions (steps of 1000) so inserts rarely
touch neighbouring rows. A move rewrites the destination column's order in a
single transaction, so concurrent moves cannot leave two tasks sharing a
position.

Moves are applied optimistically in [hooks/use-board.ts](hooks/use-board.ts) and
rolled back if the server refuses, so a rejected drag never leaves the UI
showing something the database disagrees with. `moveTaskAction` deliberately
skips `revalidatePath` — the client already holds the new order, and
revalidating would fight the optimistic state.

Dragging is never the only way to move a task. Every card exposes a keyboard
drag handle (Space to lift, arrows to move, Space to drop, with live-region
announcements) **and** a "Move to" menu listing every other column, which also
covers touch.

### Backlog and sprint planning

`/workspaces/<slug>/backlog` groups every issue by sprint, with unassigned work
in a final "Backlog" group and a "Start sprint" action on planned sprints.

`/workspaces/<slug>/sprints` is the two-pane planner: backlog on the left, the
selected sprint on the right, moving issues between them. The selected sprint is
derived from the current sprint list rather than stored, so switching workspace
cannot leave the planner pointing at a sprint that no longer exists. The add/remove
controls are gated on `TASK_UPDATE`, matching what `assignTaskToSprint`
actually enforces, so members can plan without seeing controls the server
would refuse.

### Task detail

Opening a task shows a dialog over the board rather than navigating away, so
board context is never lost. It loads the task, its subtasks, comments and
activity in one Server Action round trip.

Permissions are computed server-side per task, not per role:
`canViewerEditTask` applies the same ownership rule the mutations enforce, so
the UI hides exactly the controls the server would refuse. Comment edit and
delete are similarly resolved per comment — an author may edit their own, and
admins may additionally delete others'.

Activity entries are rendered by [lib/activity-text.ts](lib/activity-text.ts),
which turns a stored type plus metadata into a sentence such as
`Clark moved "Implement authentication" from "To Do" to "In Progress"`.

### Notifications

Services fan out through `notificationService.notify`, which de-duplicates
recipients and never notifies the actor about their own action. Every read and
mutation is scoped by `recipientId`, so one user can neither read nor dismiss
another's notifications even with a valid id.

@mentions in comments are resolved against **project membership**, so a mention
can never notify someone outside the project.

### Search and filtering

Filters live in the URL, not component state, so a filtered board is
shareable and survives reload. The server applies them in the Prisma query
rather than filtering client-side, so a large board never ships tasks the
viewer filtered out.

The board is keyed by the server's task set, so changing a filter remounts it
with fresh data instead of retaining stale optimistic ordering.

### Dashboard

The workspace page opens with a dashboard: project and task counts, overdue
work, tasks assigned to the current user, an open-tasks-by-priority breakdown,
and recent workspace activity.

Counts come from aggregate queries (`count` / `groupBy`) rather than loading
rows and counting in memory, so the dashboard does not get slower as a
workspace grows. Every query is scoped to the caller's workspace membership.

"Overdue" and "assigned to you" deliberately count **open** tasks only —
completing a task removes it from both.

Following the brief, there are no charts for their own sake: the only visual is
a proportional bar for the priority split, and each row carries screen-reader
text giving the count, total and percentage.

### Real-time collaboration

Clients subscribe to a Supabase Realtime channel per project (`project:<id>`)
and per user (`user:<id>`). Browsers never query the database — the server
broadcasts a change event after each mutation, and clients respond by
refetching through the normal authorized server path.

That keeps server-side authorization the single source of truth: a broadcast
can only ever prompt a refetch, never widen what a viewer is allowed to see.
Payloads carry ids only, no task titles or other domain data, and no Row Level
Security policies are required because no client reads Postgres directly.

Broadcasts are sent over HTTP from `after()`, so realtime never delays the
mutation's response, and a broadcast failure is logged without failing a write
that already committed. Clients ignore their own echo (`actorId` matches), so
an optimistic update is never fought by the event it caused.

### Visual design

The UI follows the Modernist prototype: square corners everywhere
(`--radius: 0px`), 1px hairline borders, Archivo at weight 800 for headings,
and `#ec3013` as the single accent. Tokens live on `:root` in
[app/globals.css](app/globals.css) as `--sp-*`, and the shadcn variables are
mapped onto them so every existing primitive inherits the look.

Issues carry a project-scoped key (`WEB-142`), a type (Story/Task/Bug/Epic)
shown as a bordered letter tile, and optional story points. Keys are allocated
by incrementing `Project.issueCounter` inside the same transaction that creates
the task, so two concurrent creates cannot collide.
