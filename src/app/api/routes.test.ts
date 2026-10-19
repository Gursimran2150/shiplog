// @vitest-environment node
import { simulateReadableStream } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { beforeEach, describe, expect, it, vi } from "vitest";

const USER = { id: "6f1c2c1e-0000-4000-8000-000000000001", name: "Asha", email: "a@b.co", isDemo: false };
const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 1, text: 1, reasoning: undefined },
};

const repo = {
  getSettings: vi.fn(),
  createEntry: vi.fn(),
  listEntries: vi.fn(),
  findReport: vi.fn(),
  saveReport: vi.fn(),
  searchEntries: vi.fn(),
  recentEntries: vi.fn(),
  getEntry: vi.fn(),
  updateEntryData: vi.fn(),
};
const fetchActivity = vi.fn();
const getModel = vi.fn();

vi.mock("@/lib/auth/session", async (orig) => ({
  ...(await orig<typeof import("@/lib/auth/session")>()),
  requireUser: async () => ({ ok: true, user: USER }),
}));
vi.mock("@/lib/db/repo", () => repo);
vi.mock("@/lib/ai/provider", () => ({ getModel: () => getModel() }));
vi.mock("@/lib/server/github", async (orig) => ({
  ...(await orig<typeof import("@/lib/server/github")>()),
  fetchActivity: (...a: unknown[]) => fetchActivity(...a),
}));

function jsonModel(json: unknown) {
  return new MockLanguageModelV4({
    doGenerate: async () => ({
      content: [{ type: "text", text: JSON.stringify(json) }],
      finishReason: { unified: "stop", raw: undefined },
      usage,
      warnings: [],
    }),
  });
}

function streamModel(chunks: string[]) {
  return new MockLanguageModelV4({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: "text-start", id: "t" },
          ...chunks.map((delta) => ({ type: "text-delta" as const, id: "t", delta })),
          { type: "text-end", id: "t" },
          { type: "finish", finishReason: { unified: "stop", raw: undefined }, usage },
        ],
      }),
    }),
  });
}

const post = (url: string, body: unknown) =>
  new Request(`http://localhost${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const data = {
  summary: "Fixed login",
  done: [{ text: "Fixed login redirect", project: "auth" }],
  inProgress: [],
  blockers: [],
  tomorrow: [],
};
const entry = { id: "e1", date: "2026-10-20", raw: "fixed login", data, words: 2, createdAt: "x" };

describe("POST /api/entries", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    repo.getSettings.mockResolvedValue({ githubUsername: "octo", standupFormat: "slack" });
    repo.createEntry.mockImplementation(async (_u, input) => ({ ...entry, ...input }));
    fetchActivity.mockResolvedValue([
      {
        kind: "commit",
        repo: "acme/web",
        title: "Add charts",
        url: "https://github.com/acme/web/commit/1",
        date: "2026-10-20",
      },
    ]);
  });

  it("structures the log, saves it and keeps only real missed GitHub links", async () => {
    getModel.mockReturnValue({
      model: jsonModel({
        ...data,
        missed: [
          { text: "Add charts", url: "https://github.com/acme/web/commit/1" },
          { text: "Invented", url: "https://github.com/evil/x/commit/9" },
        ],
        followUps: ["Is the login fix deployed yet?"],
      }),
    });
    const { POST } = await import("./entries/route");
    const res = await POST(
      post("/api/entries", { text: "aaj login fix kiya", date: "2026-10-20", timeZone: "Asia/Kolkata" }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.missed).toEqual([{ text: "Add charts", url: "https://github.com/acme/web/commit/1" }]);
    expect(body.followUps).toEqual(["Is the login fix deployed yet?"]);
    expect(body.entry.data).not.toHaveProperty("followUps");
    expect(repo.createEntry).toHaveBeenCalledWith(USER.id, expect.objectContaining({ date: "2026-10-20", words: 4 }));
    expect(fetchActivity).toHaveBeenCalledWith("octo", "2026-10-20", "2026-10-20", "Asia/Kolkata");
  });

  it("rejects an unknown time zone before calling the model", async () => {
    const { POST } = await import("./entries/route");
    const res = await POST(post("/api/entries", { text: "hello there", date: "2026-10-20", timeZone: "Mars/Base" }));
    expect(res.status).toBe(400);
    expect(getModel).not.toHaveBeenCalled();
  });
});

describe("POST /api/entries/[id]/refine", () => {
  const ID = "6f1c2c1e-0000-4000-8000-0000000000e1";
  const answers = [{ question: "Who is the usage API waiting on?", answer: "Rahul, backend, since Monday" }];
  const call = async (id: string, body: unknown) => {
    const { POST } = await import("./entries/[id]/refine/route");
    return POST(post(`/api/entries/${id}/refine`, body), { params: Promise.resolve({ id }) });
  };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    repo.getEntry.mockResolvedValue({ ...entry, id: ID });
    repo.updateEntryData.mockImplementation(async (_u, id, d) => ({ ...entry, id, data: d }));
  });

  it("folds the answers into the saved entry", async () => {
    const refined = { ...data, blockers: [{ text: "Usage API — waiting on Rahul since Monday", project: null }] };
    getModel.mockReturnValue({ model: jsonModel(refined) });
    const res = await call(ID, { answers });
    expect(res.status).toBe(200);
    expect((await res.json()).entry.data.blockers[0].text).toContain("Rahul");
    expect(repo.getEntry).toHaveBeenCalledWith(USER.id, ID);
    expect(repo.updateEntryData).toHaveBeenCalledWith(USER.id, ID, refined);
  });

  it("rejects bad ids, empty answers and other users' entries without calling the model", async () => {
    expect((await call("not-a-uuid", { answers })).status).toBe(400);
    expect((await call(ID, { answers: [] })).status).toBe(400);
    repo.getEntry.mockResolvedValue(null);
    expect((await call(ID, { answers })).status).toBe(404);
    expect(getModel).not.toHaveBeenCalled();
  });
});

describe("POST /api/reports", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    repo.listEntries.mockResolvedValue([entry]);
    repo.saveReport.mockResolvedValue(undefined);
  });

  const body = { kind: "standup", from: "2026-10-19", to: "2026-10-20", format: "slack" };

  it("returns a stored report without calling the model when entries are unchanged", async () => {
    repo.findReport.mockResolvedValue("*Yesterday* • Fixed login");
    const { POST } = await import("./reports/route");
    const res = await POST(post("/api/reports", body));
    expect(res.headers.get("X-Cache")).toBe("HIT");
    expect(await res.text()).toBe("*Yesterday* • Fixed login");
    expect(getModel).not.toHaveBeenCalled();
  });

  it("streams a new report and saves it under the input hash", async () => {
    repo.findReport.mockResolvedValue(null);
    getModel.mockReturnValue({ model: streamModel(["*Yesterday*", " • Fixed login"]) });
    const { POST } = await import("./reports/route");
    const res = await POST(post("/api/reports", body));
    expect(await res.text()).toBe("*Yesterday* • Fixed login");
    await vi.waitFor(() =>
      expect(repo.saveReport).toHaveBeenCalledWith(USER.id, "standup", expect.any(String), "*Yesterday* • Fixed login"),
    );
  });

  it("returns 404 when there are no entries in the range", async () => {
    repo.listEntries.mockResolvedValue([]);
    const { POST } = await import("./reports/route");
    expect((await POST(post("/api/reports", body))).status).toBe(404);
  });
});

describe("POST /api/ask", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("answers from full-text matches plus recent entries", async () => {
    repo.searchEntries.mockResolvedValue([entry]);
    repo.recentEntries.mockResolvedValue([entry]);
    getModel.mockReturnValue({ model: streamModel(["You fixed login on 20 Oct."]) });
    const { POST } = await import("./ask/route");
    const res = await POST(post("/api/ask", { question: "when did I fix login?", today: "2026-10-20" }));
    expect(await res.text()).toBe("You fixed login on 20 Oct.");
    expect(repo.searchEntries).toHaveBeenCalledWith(USER.id, "when did I fix login?");
  });
});

describe("POST /api/tickets", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns a ticket and a prefilled GitHub new-issue link for a repo", async () => {
    getModel.mockReturnValue({
      model: jsonModel({ title: "Ship usage API", body: "- [ ] endpoint", labels: ["backend", "blocked"] }),
    });
    const { POST } = await import("./tickets/route");
    const res = await POST(post("/api/tickets", { text: "Usage API not ready", repo: "acme/web" }));
    const body = await res.json();
    expect(body.ticket.title).toBe("Ship usage API");
    expect(body.issueUrl).toMatch(/^https:\/\/github\.com\/acme\/web\/issues\/new\?title=Ship\+usage\+API/);
  });

  it("rejects a malformed repo", async () => {
    const { POST } = await import("./tickets/route");
    expect((await POST(post("/api/tickets", { text: "x y z", repo: "not a repo" }))).status).toBe(400);
  });
});
