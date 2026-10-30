import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import App from "../src/App";

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
});
test("home reads catalog count and offers guided search", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: "ok" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [{ id: "one" }] }),
  );
  render(<App />);
  expect(
    await screen.findByText("1 reviewed cards in our starting collection"),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Find my match" })).toHaveAttribute(
    "href",
    "/guided",
  );
});
test("guided navigation preserves spending and permits skipping it", async () => {
  window.history.replaceState({}, "", "/guided");
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByLabelText(/Travel rewards/));
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.type(screen.getByRole("spinbutton", { name: "Groceries" }), "350");
  await user.click(screen.getByRole("button", { name: "Back" }));
  expect(screen.getByLabelText(/Travel rewards/)).toBeChecked();
  await user.click(screen.getByRole("button", { name: "Continue" }));
  expect(screen.getByRole("spinbutton", { name: "Groceries" })).toHaveValue(
    350,
  );
  await user.click(screen.getByRole("button", { name: "Skip spending" }));
  expect(
    screen.getByRole("heading", { name: "What annual fee feels right?" }),
  ).toBeInTheDocument();
});
