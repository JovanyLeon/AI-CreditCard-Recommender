import { expect, test, type Page } from "@playwright/test";

async function finishQuestions(page: Page) {
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("spinbutton", { name: "Groceries", exact: true })
    .fill("350");
  await page
    .getByRole("spinbutton", { name: "Dining", exact: true })
    .fill("200");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("$0 only", { exact: false }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
}

test("real guided flow, breakdown, comparison, details, and restart", async ({
  page,
}, info) => {
  await page.goto("/");
  await expect(
    page.getByText("6 reviewed cards in our starting collection"),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/home-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("link", { name: "Find my match", exact: true }).click();
  await finishQuestions(page);
  const responsePromise = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/v1/recommendations") &&
      r.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Find my matches", exact: true })
    .click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.recommendations).toHaveLength(3);
  expect(
    data.recommendations.every(
      (r: { card: { annual_fee: number } }) => r.card.annual_fee === 0,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("heading", { name: "Your best matches." }),
  ).toBeVisible();
  await expect(page.locator(".recommendation-card")).toHaveCount(3);
  await page.getByText("See match breakdown", { exact: true }).first().click();
  await expect(
    page.getByText("Rewards fit", { exact: true }).first(),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/results-${info.project.name}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Compare top 3" }).click();
  await expect(page.locator(".comparison-card")).toHaveCount(3);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "All details" }).first().click();
  await expect(
    page.getByRole("heading", { name: "The essentials" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "View issuer terms" }),
  ).toHaveAttribute("href", /^https:\/\//);
  await page.getByRole("link", { name: "Back to matches" }).click();
  await page
    .getByRole("link", { name: "Edit preferences", exact: true })
    .click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("spinbutton", { name: "Groceries", exact: true }),
  ).toHaveValue("350");
  await page.goBack();
  await page.getByRole("link", { name: "Start over" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("spinbutton", { name: "Groceries", exact: true }),
  ).toHaveValue("");
});

test("negative spending is blocked and strict exclusions show an empty state", async ({
  page,
}) => {
  await page.goto("/guided");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("spinbutton", { name: "Groceries", exact: true })
    .fill("-1");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("spinbutton", { name: "Groceries", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Skip spending" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByPlaceholder("e.g. Chase, Capital One")
    .fill("Chase, Capital One");
  await page
    .getByRole("button", { name: "Find my matches", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "No card matches every preference." }),
  ).toBeVisible();
  await expect(page.getByText("Exclude: capital one, chase")).toBeVisible();
});

test("failed API request retains preferences and can be retried", async ({
  page,
}) => {
  await page.goto("/guided");
  await finishQuestions(page);
  await page.route("**/api/v1/recommendations", (route) =>
    route.fulfill({ status: 503, body: "{}" }),
  );
  await page
    .getByRole("button", { name: "Find my matches", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Your preferences are still here",
  );
  await page.unroute("**/api/v1/recommendations");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.locator(".recommendation-card")).toHaveCount(3);
});
