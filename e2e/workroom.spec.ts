import { expect, test } from "@playwright/test";

test("renders and operates the ten-agent research workroom", async ({
  page,
}) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  await page.goto("/");
  await expect(page.locator("main.workroom")).toHaveAttribute(
    "data-hydrated",
    "true",
  );

  await expect(
    page.getByRole("heading", { name: "Agent Swarm" }),
  ).toBeVisible();
  await expect(page.locator(".agent-card")).toHaveCount(10);

  const debaterB = page.getByRole("button", { name: /Debater B/ });
  await debaterB.click();
  await expect(debaterB).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.locator(".selected-agent .agent-profile strong"),
  ).toHaveText("Debater B");

  await page.locator(".tab-list [role='tab']").nth(2).click();
  await expect(page.locator(".log-row")).toHaveCount(2);
  await expect(page.locator(".log-row")).toContainText([
    "Literature Researcher",
    "Global Translator",
  ]);
  await expect(
    page.locator(".log-row").filter({ hasText: "Debater A" }),
  ).toHaveCount(0);
  expect(browserErrors).toEqual([]);
});

test("keeps the dashboard inside a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.locator(".agent-card")).toHaveCount(10);
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});
