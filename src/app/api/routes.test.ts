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
const tasks = {
  openTasks: vi.fn(),
  insertTasks: vi.fn(),
  getTask: vi.fn(),
  taskEvents: vi.fn(),
  taskNotes: vi.fn(),
  listTasks: vi.fn(),
  eventsForTasks: vi.fn(),
};
vi.mock("@/lib/db/tasks", () => tasks);
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
  done: [{ text: "Fixed login redirect", project: "auth" }] as {
    text: string;
    project: string | null;
    taskId?: string;
  }[],
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
    tasks.openTasks.mockResolvedValue([
      { id: "6f1c2c1e-0000-4000-8000-00000000aaaa", title: "Login redirect", project: "auth", status: "in_progress" },
    ]);
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
        done: [{ text: "Fixed login redirect", project: "auth", task: "t1" }],
        tomorrow: [{ text: "Dashboard charts", project: "dashboard", task: "new" }],
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
    // The model's "t1" became the real task id; "new" created a task first.
    expect(body.entry.data.done[0].taskId).toBe("6f1c2c1e-0000-4000-8000-00000000aaaa");
    expect(tasks.insertTasks).toHaveBeenCalledWith(USER.id, [
      { id: body.entry.data.tomorrow[0].taskId, title: "Dashboard charts", project: "dashboard" },
    ]);
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
    tasks.openTasks.mockResolvedValue([]);
    repo.updateEntryData.mockImplementation(async (_u, id, d) => ({ ...entry, id, data: d }));
  });

  it("folds the answers into the saved entry", async () => {
    const blocker = { text: "Usage API — waiting on Rahul since Monday", project: null };
    const refined = { ...data, done: [{ ...data.done[0], task: null }], blockers: [{ ...blocker, task: null }] };
    getModel.mockReturnValue({ model: jsonModel(refined) });
    const res = await call(ID, { answers });
    expect(res.status).toBe(200);
    expect((await res.json()).entry.data.blockers[0].text).toContain("Rahul");
    expect(repo.getEntry).toHaveBeenCalledWith(USER.id, ID);
    expect(repo.updateEntryData).toHaveBeenCalledWith(USER.id, ID, { ...data, blockers: [blocker] });
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

const TASK_ID = "6f1c2c1e-0000-4000-8000-00000000bbbb";
const task = {
  id: TASK_ID,
  title: "Integrate the usage API",
  project: "dashboard",
  status: "blocked",
  firstDate: "2026-10-14",
  lastDate: "2026-10-16",
  events: 2,
  notes: 0,
};
const tev = (date: string, section: string, text: string) => ({ entryId: "e1", date, section, index: 0, text });

describe("GET /api/waiting", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("lists blocked tasks with who they wait on and since when", async () => {
    tasks.listTasks.mockResolvedValue([task, { ...task, id: "done-task", status: "done" }]);
    tasks.eventsForTasks.mockResolvedValue(
      new Map([
        [
          TASK_ID,
          [
            tev("2026-10-14", "blockers", "Usage API not ready"),
            tev("2026-10-16", "blockers", "Usage API not ready (waiting on Rahul)"),
          ],
        ],
      ]),
    );
    const { GET } = await import("./waiting/route");
    const res = await GET(new Request("http://localhost/api/waiting"));
    expect((await res.json()).items).toEqual([
      {
        taskId: TASK_ID,
        title: "Integrate the usage API",
        project: "dashboard",
        blocker: "Usage API not ready (waiting on Rahul)",
        person: "Rahul",
        since: "2026-10-14",
      },
    ]);
    expect(tasks.eventsForTasks).toHaveBeenCalledWith(USER.id, [TASK_ID]);
  });
});

describe("POST /api/waiting/nudge", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    tasks.getTask.mockResolvedValue(task);
    tasks.taskNotes.mockResolvedValue([]);
  });

  it("streams a follow-up message for a blocked task", async () => {
    tasks.taskEvents.mockResolvedValue([tev("2026-10-14", "blockers", "Usage API not ready (waiting on Rahul)")]);
    getModel.mockReturnValue({ model: streamModel(["Hi Rahul, ", "any ETA on the usage API?"]) });
    const { POST } = await import("./waiting/nudge/route");
    const res = await POST(post("/api/waiting/nudge", { taskId: TASK_ID, tone: "firm", today: "2026-10-19" }));
    expect(await res.text()).toBe("Hi Rahul, any ETA on the usage API?");
  });

  it("refuses tasks without a blocker, and unknown tasks, before calling the model", async () => {
    tasks.taskEvents.mockResolvedValue([tev("2026-10-14", "inProgress", "Charts")]);
    const { POST } = await import("./waiting/nudge/route");
    expect((await POST(post("/api/waiting/nudge", { taskId: TASK_ID, today: "2026-10-19" }))).status).toBe(400);
    tasks.getTask.mockResolvedValue(null);
    expect((await POST(post("/api/waiting/nudge", { taskId: TASK_ID, today: "2026-10-19" }))).status).toBe(404);
    expect(getModel).not.toHaveBeenCalled();
  });
});

describe("POST /api/pr", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("streams a PR description, using the picked task's journey for context", async () => {
    tasks.getTask.mockResolvedValue(task);
    tasks.taskEvents.mockResolvedValue([tev("2026-10-14", "blockers", "Usage API not ready")]);
    tasks.taskNotes.mockResolvedValue([]);
    getModel.mockReturnValue({ model: streamModel(["# Wire usage API into dashboard"]) });
    const { POST } = await import("./pr/route");
    const res = await POST(
      post("/api/pr", {
        changes: "usage charts ko real API se joda, mock hata diya",
        taskId: TASK_ID,
        ticket: "DASH-42",
      }),
    );
    expect(await res.text()).toBe("# Wire usage API into dashboard");
    expect(tasks.getTask).toHaveBeenCalledWith(USER.id, TASK_ID);
  });

  it("rejects a too-short summary and odd ticket ids", async () => {
    const { POST } = await import("./pr/route");
    expect((await POST(post("/api/pr", { changes: "fix" }))).status).toBe(400);
    expect((await POST(post("/api/pr", { changes: "fixed the login redirect", ticket: "<script>" }))).status).toBe(400);
    expect(getModel).not.toHaveBeenCalled();
  });
});

describe("POST /api/tasks/[id]/postmortem", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    tasks.taskNotes.mockResolvedValue([]);
  });
  const call = async (id: string) => {
    const { POST } = await import("./tasks/[id]/postmortem/route");
    return POST(post(`/api/tasks/${id}/postmortem`, { today: "2026-10-19" }), { params: Promise.resolve({ id }) });
  };

  it("streams a postmortem from the journey", async () => {
    tasks.getTask.mockResolvedValue(task);
    tasks.taskEvents.mockResolvedValue([tev("2026-10-14", "blockers", "Usage API not ready")]);
    getModel.mockReturnValue({ model: streamModel(["# Postmortem: Integrate the usage API"]) });
    expect(await (await call(TASK_ID)).text()).toBe("# Postmortem: Integrate the usage API");
  });

  it("404s for someone else's task and 400s for an empty journey", async () => {
    tasks.getTask.mockResolvedValue(null);
    tasks.taskEvents.mockResolvedValue([]);
    expect((await call(TASK_ID)).status).toBe(404);
    tasks.getTask.mockResolvedValue(task);
    expect((await call(TASK_ID)).status).toBe(400);
    expect((await call("nope")).status).toBe(400);
    expect(getModel).not.toHaveBeenCalled();
  });
});
