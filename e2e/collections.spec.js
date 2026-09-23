import { expect, test } from "@playwright/test";

const collectionName = `E2E Collection ${Date.now()}`;

test("login, create a collection, save an article, view it and remove it", async ({
  page,
}) => {
  // Login with the seeded user
  await page.goto("/#/login");
  await page.getByPlaceholder("Email").fill("example1@mail.com");
  await page.getByPlaceholder("Password").fill("examplePwd1");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page.getByRole("link", { name: "My Collections" })).toBeVisible();

  // Create a collection
  await page.getByRole("link", { name: "My Collections" }).click();
  await page.getByPlaceholder("Collection name").fill(collectionName);
  await page.getByRole("button", { name: "Create Collection" }).click();

  await expect(page.getByText("Collection created.")).toBeVisible();
  const card = page.locator(".article-preview", { hasText: collectionName });
  await expect(card).toBeVisible();

  // Save an article into it from the article page
  await page.goto("/#/article/lorem-ipsum-1");
  await page.getByRole("button", { name: "Save to collection" }).click();
  await page.getByRole("button", { name: new RegExp(collectionName) }).click();

  // View the article inside the collection
  await page.goto("/#/collections");
  await page
    .locator(".article-preview", { hasText: collectionName })
    .getByRole("link", { name: "Open" })
    .click();

  await expect(
    page.getByRole("heading", { name: collectionName }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lorem Ipsum 1" })).toBeVisible();

  // Remove it from the collection
  await page.getByRole("button", { name: "Remove" }).click();
  await expect(
    page.getByText("Article removed from collection."),
  ).toBeVisible();
  await expect(
    page.getByText("No articles saved in this collection yet."),
  ).toBeVisible();

  // Clean up: delete the collection
  await page.goto("/#/collections");
  page.on("dialog", (dialog) => dialog.accept());
  await page
    .locator(".article-preview", { hasText: collectionName })
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(
    page.locator(".article-preview", { hasText: collectionName }),
  ).toHaveCount(0);
});
