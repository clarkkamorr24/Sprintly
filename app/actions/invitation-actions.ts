"use server";

import { revalidatePath } from "next/cache";

import { handleAction } from "@/lib/api-response";
import { parseInput } from "@/lib/validation";
import * as invitationService from "@/services/invitation-service";
import {
  inviteMemberSchema,
  revokeInvitationSchema,
} from "@/schemas/workspace";
import type { ApiResponse } from "@/types/api";
import type { InviteMemberResultDTO } from "@/types/dto";

export async function inviteMemberAction(
  input: unknown
): Promise<ApiResponse<InviteMemberResultDTO>> {
  return handleAction("inviteMemberAction", async () => {
    const data = parseInput(inviteMemberSchema, input);
    const invitation = await invitationService.inviteMember(data);

    revalidatePath("/[workspaceSlug]/team", "page");
    return invitation;
  });
}

export async function revokeInvitationAction(
  input: unknown
): Promise<ApiResponse<null>> {
  return handleAction("revokeInvitationAction", async () => {
    const data = parseInput(revokeInvitationSchema, input);
    await invitationService.revokeInvitation(data);

    revalidatePath("/[workspaceSlug]", "layout");
    return null;
  });
}
