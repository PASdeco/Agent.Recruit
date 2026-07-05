import { NextResponse } from "next/server";
import { runAutomationStep } from "@/lib/automation-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { ownerAddress?: string };
    const result = await runAutomationStep({ ownerAddress: body.ownerAddress });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        action: "none",
        message: error instanceof Error ? error.message : "Automation failed."
      },
      { status: 500 }
    );
  }
}
