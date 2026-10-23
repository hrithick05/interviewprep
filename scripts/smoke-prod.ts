const apiUrl = process.env.PRODUCTION_API_URL;
const clientUrl = process.env.PRODUCTION_CLIENT_URL;

if (!apiUrl || !clientUrl) {
  throw new Error("Set PRODUCTION_API_URL and PRODUCTION_CLIENT_URL before running the production smoke test.");
}

const apiResponse = await fetch(`${apiUrl.replace(/\/$/, "")}/api/v1/health`);
if (!apiResponse.ok) throw new Error(`Render health check failed: ${apiResponse.status}`);
const apiBody = await apiResponse.json() as { data?: { status?: string } };
if (apiBody.data?.status !== "ok") throw new Error("Render health response is invalid.");

const clientResponse = await fetch(clientUrl);
if (!clientResponse.ok) throw new Error(`Client page failed: ${clientResponse.status}`);
const html = await clientResponse.text();
if (!html.includes("<div id=\"root\"></div>")) throw new Error("Vercel client did not return the expected app shell.");

const csp = apiResponse.headers.get("content-security-policy") ?? "";
if (!csp) throw new Error("API response is missing a Content-Security-Policy header.");
if (clientHtmlContainsSecret(html)) throw new Error("The client bundle appears to contain a server secret.");

console.log(`PrepForge smoke passed: API ${apiUrl}, client ${clientUrl}`);

function clientHtmlContainsSecret(source: string): boolean {
  const secretEnvironment = process.env;
  return ["SUPABASE_SECRET_KEY", "ANTHROPIC_API_KEY", "XAI_API_KEY", "GROQ_API_KEY", "JUDGE0_KEY"]
    .some((name) => Boolean(secretEnvironment[name]) && source.includes(secretEnvironment[name] ?? ""));
}
