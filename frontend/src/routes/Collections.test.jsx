import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, test, vi } from "vitest";
import Collections from "./Collections";

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ headers: { Authorization: "Token test" }, isAuth: true }),
}));

vi.mock("../services/collections", () => ({
  addArticleToCollection: vi.fn(),
  createCollection: vi.fn(),
  deleteCollection: vi.fn(),
  getArticleCollections: vi.fn(),
  listCollections: vi.fn(),
  removeArticleFromCollection: vi.fn(),
  updateCollection: vi.fn(),
}));

import { listCollections } from "../services/collections";

const renderCollections = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Collections />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("Collections page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("shows a loading state then the empty state", async () => {
    listCollections.mockResolvedValue({ collections: [], nextCursor: null });

    renderCollections();

    expect(screen.getByText(/Loading collections/)).toBeInTheDocument();
    expect(
      await screen.findByText(/You have no collections yet/),
    ).toBeInTheDocument();
  });

  test("renders collections with their article counts", async () => {
    listCollections.mockResolvedValue({
      collections: [
        { articlesCount: 2, description: "later", id: 1, name: "Reading" },
      ],
      nextCursor: null,
    });

    renderCollections();

    expect(
      await screen.findByRole("heading", { name: "Reading" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 articles")).toBeInTheDocument();
  });

  test("surfaces a list error", async () => {
    listCollections.mockRejectedValue(new Error("Could not load"));

    renderCollections();

    expect(await screen.findByText("Could not load")).toBeInTheDocument();
  });
});
