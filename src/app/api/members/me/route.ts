import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/session";

/**
 * GET /api/members/me
 * Get the current user's member record
 */
export async function GET() {
  try {
    const member = await getCurrentMember();

    if (!member) {
      return NextResponse.json({ member: null });
    }

    return NextResponse.json({ member });
  } catch (error) {
    console.error("GET /api/members/me error:", error);
    return NextResponse.json(
      { error: "Error fetching current member" },
      { status: 500 }
    );
  }
}
