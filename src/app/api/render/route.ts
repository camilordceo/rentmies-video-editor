import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { renderRequestSchema } from "@/lib/types";
import { getUser } from "@/lib/supabase-auth";
import { getUserCredits, deductCredit, isAdminBypass } from "@/lib/credit-service";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const { data: { user } } = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Credit check (admins bypass)
    const isAdmin = await isAdminBypass(user.id);
    if (!isAdmin) {
      const credits = await getUserCredits(user.id);
      if (credits < 1) {
        return NextResponse.json(
          { error: "Insufficient credits", creditsRemaining: credits, requiredCredits: 1 },
          { status: 402 }
        );
      }
      await deductCredit(user.id, 1);
    }

    const body = await request.json();

    const parsed = renderRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid render request",
          details: parsed.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }

    const { projectId, outputFormat, quality } = parsed.data;

    const qualitySettings = {
      draft: { crf: 28, scale: 0.5 },
      standard: { crf: 18, scale: 1 },
      high: { crf: 12, scale: 1 },
    };

    const settings = qualitySettings[quality];

    const jobId = uuidv4();

    // In a real implementation, you would:
    // 1. Store the job in a database
    // 2. Push to a render queue (e.g., BullMQ, SQS)
    // 3. The worker would call renderMedia() from @remotion/renderer
    //
    // Example with @remotion/renderer:
    //
    // import { bundle } from "@remotion/bundler";
    // import { renderMedia, selectComposition } from "@remotion/renderer";
    //
    // const bundled = await bundle(path.resolve("./src/remotion/Root.tsx"));
    // const composition = await selectComposition({ serveUrl: bundled, id: "VideoEditor" });
    // await renderMedia({
    //   composition,
    //   serveUrl: bundled,
    //   codec: "h264",
    //   outputLocation: `out/${jobId}.mp4`,
    //   inputProps: { scenes: project.scenes },
    // });

    const response = {
      jobId,
      projectId,
      status: "queued" as const,
      progress: 0,
      outputUrl: null,
      error: null,
      settings: {
        format: outputFormat,
        quality,
        crf: settings.crf,
        scale: settings.scale,
      },
      message:
        "Render job created. In production, this would trigger server-side rendering via Remotion Lambda or a dedicated render server.",
      estimatedDuration: quality === "high" ? "3-5 minutes" : quality === "standard" ? "1-3 minutes" : "30-60 seconds",
    };

    return NextResponse.json(response, { status: 202 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Render error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET endpoint to check render job status.
 * In production, this would query the job status from a database.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json(
      { error: "jobId query parameter is required" },
      { status: 400 }
    );
  }

  // In production, look up the job in your database
  return NextResponse.json({
    jobId,
    status: "queued",
    progress: 0,
    outputUrl: null,
    error: null,
    message: "In production, this would return real render progress.",
  });
}
