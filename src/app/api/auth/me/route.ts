import { NO_STORE, userRoute } from "@/lib/api/route";

export const GET = userRoute({}, ({ user }) => Response.json({ user }, { headers: NO_STORE }));
