import { ApiError } from "./api";
import { LIST_NAMES, type ListName } from "./schemas";

export function parseList(v: string): ListName {
  if (!(LIST_NAMES as string[]).includes(v)) throw new ApiError(404, "not_found");
  return v as ListName;
}
