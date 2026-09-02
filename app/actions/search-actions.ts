"use server";

import { handleAction } from "@/lib/api-response";
import { parseInput } from "@/lib/validation";
import { searchWorkspaceSchema } from "@/schemas/search";
import * as searchService from "@/services/search-service";
import type { ApiResponse } from "@/types/api";
import type { SearchResultsDTO } from "@/types/dto";

export async function searchWorkspaceAction(
  input: unknown
): Promise<ApiResponse<SearchResultsDTO>> {
  return handleAction("searchWorkspaceAction", async () => {
    const data = parseInput(searchWorkspaceSchema, input);
    return searchService.searchWorkspace(data);
  });
}
