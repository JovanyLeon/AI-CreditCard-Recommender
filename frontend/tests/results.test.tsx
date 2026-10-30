import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import App from "../src/App";

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
});

test("submission converts inputs and shows a loading then empty state", async () => {
  window.history.replaceState({}, "", "/guided");
  let finish: (value: unknown) => void = () => {};
  const fetchMock = vi.fn().mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  vi.stubGlobal("fetch", fetchMock);
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.type(screen.getByRole("spinbutton", { name: "Groceries" }), "350");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByLabelText(/Up to \$95/));
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByLabelText(/No foreign transaction fees/));
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.type(
    screen.getByPlaceholderText("e.g. Chase, Capital One"),
    "Chase, Citi",
  );
  await user.click(screen.getByRole("button", { name: "Find my matches" }));
  expect(await screen.findByRole("status")).toHaveTextContent(
    "Finding your best matches",
  );
  const body = JSON.parse(fetchMock.mock.calls[0][1].body);
  expect(body).toMatchObject({
    max_annual_fee: 95,
    monthly_spending: { groceries: 350 },
    issuer_exclusions: ["Chase", "Citi"],
    wants_no_foreign_transaction_fee: true,
  });
  finish({
    ok: true,
    json: async () => ({
      preferences: body,
      recommendations: [],
      compared_count: 6,
      eligible_count: 0,
      algorithm_version: "1.0",
      notices: [],
    }),
  });
  expect(
    await screen.findByRole("heading", {
      name: "No card matches every preference.",
    }),
  ).toBeInTheDocument();
});
