import "server-only";

import { notFound, redirect, unstable_rethrow } from "next/navigation";

import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "@/lib/errors";

export async function loadPage<T>(load: () => Promise<T>): Promise<T> {
  try {
    return await load();
  } catch (error) {
    unstable_rethrow(error);

    if (error instanceof UnauthorizedError) redirect("/sign-in");
    
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      notFound();
    }

    throw error;
  }
}
