"use server";

import { revalidatePath } from "next/cache";

import { handleAction } from "@/lib/api-response";
import * as onboardingService from "@/services/onboarding-service";
import type { ApiResponse } from "@/types/api";

export async function completeOnboardingAction(): Promise<ApiResponse<null>> {
  return handleAction("completeOnboardingAction", async () => {
    await onboardingService.completeOnboarding();

    revalidatePath("/", "layout");
    return null;
  });
}
