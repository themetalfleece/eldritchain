import { QueryClient } from "@tanstack/react-query";
import { beforeEach, vi } from "vitest";

// Provide a global mock for react-query's useQueryClient so tests don't need a provider
vi.mock("@tanstack/react-query", async () => {
  const actual =
    await vi.importActual<typeof import("@tanstack/react-query")>("@tanstack/react-query");

  const fakeClient = {
    resetQueries: vi.fn(),
    invalidateQueries: vi.fn(),
    refetchQueries: vi.fn(),
  } as unknown as QueryClient;

  return {
    ...actual,
    useQueryClient: () => fakeClient,
  };
});

// Mock localStorage with actual storage behavior
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
});
