// Native Vercel Cron target (see vercel.json). Runs weekly and triggers a fresh
// production build via a Vercel Deploy Hook. The build re-scrapes the catalog
// (see the "build" script in package.json), so the redeployed site + MCP serve
// fresh data. This function itself returns instantly (no long scrape here).
//
// Vercel automatically sends `Authorization: Bearer ${CRON_SECRET}` on cron
// invocations when CRON_SECRET is set; we verify it so the hook can't be spammed.

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }
  }

  const hook = process.env.DEPLOY_HOOK_URL;
  if (!hook) {
    return Response.json({ ok: false, error: "DEPLOY_HOOK_URL not configured" }, { status: 501 });
  }

  const res = await fetch(hook, { method: "POST" });
  return Response.json({
    ok: res.ok,
    triggeredDeploy: true,
    hookStatus: res.status,
    note: "Production rebuild triggered; the build re-scrapes buyme.co.il for fresh data.",
  });
}
