import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { errorResponse } from "./api-response";

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { session: null, error: errorResponse("Unauthorized", 401) };
  }
  return { session, error: null };
}

export async function requireAdmin() {
  const { session, error } = await requireAuth();
  if (error) return { session: null, error };
  if (session!.user.role !== "admin") {
    return { session: null, error: errorResponse("Admin access required", 403) };
  }
  return { session, error: null };
}
