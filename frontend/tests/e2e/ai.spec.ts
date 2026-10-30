import { expect, test } from "@playwright/test";

test("AI disabled still leads to a functional guided search", async ({
  page,
}) => {
  await page.goto("/ai");
  await expect(
    page.getByText("Guided search is ready when you are."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Understand my preferences" }),
  ).toBeDisabled();
  await page.getByRole("link", { name: "Use guided search" }).click();
  await expect(
    page.getByRole("heading", { name: "What matters most to you?" }),
  ).toBeVisible();
});

test("mocked AI interpretation confirms through the real recommendation API", async ({
  page,
  request,
}) => {
  const response = await request.post(
    "http://127.0.0.1:8000/api/v1/recommendations",
    {
      data: {
        primary_goal: "cash_back",
        max_annual_fee: 0,
        monthly_spending: { groceries: 300 },
      },
    },
  );
  const result = await response.json();
  await page.route("**/api/v1/ai/status", (route) =>
    route.fulfill({ json: { ai_enabled: true } }),
  );
  await page.route("**/api/v1/ai/recommendations", (route) =>
    route.fulfill({
      json: {
        interpreted_preferences: result.preferences,
        result,
        needs_follow_up: false,
        follow_up_question: null,
        missing_information: [],
        conflicts: [],
        ai_enabled: true,
      },
    }),
  );
  await page.goto("/ai");
  await page
    .getByLabel("Describe your ideal card")
    .fill(
      "I want grocery cash back with no annual fee. Groceries are $300 a month.",
    );
  await page.getByRole("button", { name: "Understand my preferences" }).click();
  await expect(
    page.getByRole("heading", { name: "Here’s what we understood." }),
  ).toBeVisible();
  await expect(page.locator(".recommendation-card")).toHaveCount(0);
  await page.getByRole("button", { name: "See my matches" }).click();
  await expect(page.locator(".recommendation-card")).toHaveCount(3);
  await expect(page.locator(".recommendation-card").first()).toContainText(
    result.recommendations[0].card.name,
  );
});
