import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// `server-only` throws outside a React Server environment; it is a no-op in tests.
vi.mock("server-only", () => ({}));

afterEach(() => cleanup());
