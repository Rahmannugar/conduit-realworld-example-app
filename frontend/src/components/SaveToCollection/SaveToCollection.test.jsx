import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, test, vi } from "vitest";
import SaveToCollection from "./SaveToCollection";

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ headers: { Authorization: "Token test" }, isAuth: true }),
}));

vi.mock("../../services/collections", () => ({
  addArticleToCollection: vi.fn(),
  createCollection: vi.fn(),
  deleteCollection: vi.fn(),
  listCollections: vi.fn(),
  removeArticleFromCollection: vi.fn(),
  updateCollection: vi.fn(),
}));

import {
  addArticleToCollection,
  listCollections,
} from "../../services/collections";

const renderControl = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SaveToCollection slug="an-article" />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const oneCollection = {
  collections: [
    { articlesCount: 0, description: null, id: 7, name: "Reading" },
  ],
  nextCursor: null,
};

describe("SaveToCollection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listCollections.mockResolvedValue(oneCollection);
  });

  test("adds the article to a collection", async () => {
    const user = userEvent.setup();
    addArticleToCollection.mockResolvedValue({ slug: "an-article" });

    renderControl();

    await user.click(screen.getByRole("button", { name: /Save to collection/ }));
    await user.click(await screen.findByRole("button", { name: /Reading/ }));

    expect(addArticleToCollection).toHaveBeenCalledWith({
      collectionId: 7,
      headers: { Authorization: "Token test" },
      slug: "an-article",
    });
  });

  test("surfaces an error when the article is already in the collection", async () => {
    const user = userEvent.setup();
    addArticleToCollection.mockRejectedValue(
      new Error("Article is already in this collection"),
    );

    renderControl();

    await user.click(screen.getByRole("button", { name: /Save to collection/ }));
    await user.click(await screen.findByRole("button", { name: /Reading/ }));

    expect(
      await screen.findByText(/already in this collection/),
    ).toBeInTheDocument();
  });

  test("guides the user to create a collection when none exist", async () => {
    const user = userEvent.setup();
    listCollections.mockResolvedValue({ collections: [], nextCursor: null });

    renderControl();

    await user.click(screen.getByRole("button", { name: /Save to collection/ }));

    expect(
      await screen.findByText(/No collections yet/),
    ).toBeInTheDocument();
  });
});
