import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import App from "../src/App";
import { defaultPreferences } from "../src/features/preferences";

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
});
const response = (value: unknown) => ({ ok: true, json: async () => value });

test("disabled AI gives a usable guided fallback", async () => {
  window.history.replaceState({}, "", "/ai");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(response({ ai_enabled: false })),
  );
  render(<App />);
  expect(
    await screen.findByText("Guided search is ready when you are."),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Understand my preferences" }),
  ).toBeDisabled();
  expect(
    screen.getByRole("link", { name: "Use guided search" }),
  ).toHaveAttribute("href", "/guided");
});

test("AI interpretation stays reviewable and editable before results", async () => {
  window.history.replaceState({}, "", "/ai");
  const preferences = {
    ...defaultPreferences(),
    primary_goal: "travel",
    max_annual_fee: 95,
  };
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(response({ ai_enabled: true }))
    .mockResolvedValueOnce(
      response({
        interpreted_preferences: preferences,
        result: null,
        needs_follow_up: false,
        follow_up_question: null,
        missing_information: [],
        conflicts: [],
        ai_enabled: true,
      }),
    );
  vi.stubGlobal("fetch", fetchMock);
  const user = userEvent.setup();
  render(<App />);
  const prompt = await screen.findByLabelText("Describe your ideal card");
  await vi.waitFor(() => expect(prompt).toBeEnabled());
  await user.type(prompt, "I travel and am happy with a fee up to $95");
  await user.click(
    screen.getByRole("button", { name: "Understand my preferences" }),
  );
  expect(
    await screen.findByRole("heading", { name: "Here’s what we understood." }),
  ).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledTimes(2);
  await user.click(screen.getByRole("button", { name: "Edit preferences" }));
  expect(screen.getByLabelText(/Travel rewards/)).toBeChecked();
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: "Skip spending" }));
  expect(screen.getByLabelText(/Up to \$95/)).toBeChecked();
});

test("provider error preserves the prompt and offers a fallback", async () => {
  window.history.replaceState({}, "", "/ai");
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(response({ ai_enabled: true }))
      .mockResolvedValueOnce({ ok: false, status: 503 }),
  );
  const user = userEvent.setup();
  render(<App />);
  const prompt = await screen.findByLabelText("Describe your ideal card");
  await vi.waitFor(() => expect(prompt).toBeEnabled());
  await user.type(prompt, "I want cash back and no annual fee");
  await user.click(
    screen.getByRole("button", { name: "Understand my preferences" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "temporarily unavailable",
  );
  expect(prompt).toHaveValue("I want cash back and no annual fee");
  expect(
    screen.getByRole("link", { name: "Use guided search" }),
  ).toHaveAttribute("href", "/guided");
});
