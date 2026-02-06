import { NextResponse } from "next/server";
import { requireMember } from "@/lib/session";
import { getNotificationsForMember } from "@/lib/notifications";

/**
 * GET /api/notifications
 * Get notifications for the current member
 */
export async function GET() {
  try {
    const member = await requireMember();
    const notifications = await getNotificationsForMember(member.id);

    return NextResponse.json({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    });
  } catch (error) {
    console.error("GET /api/notifications error:", error);

    if (error instanceof Error && error.message === "Not a member of any household") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "Error fetching notifications" }, { status: 500 });
  }
}
