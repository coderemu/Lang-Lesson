import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = { needRefresh: false, setNeedRefresh: vi.fn(), update: vi.fn() };
vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: () => ({
    needRefresh: [state.needRefresh, state.setNeedRefresh],
    offlineReady: [false, () => undefined],
    updateServiceWorker: state.update,
  }),
}));

import { UpdateToast } from "./UpdateToast";

beforeEach(() => {
  state.needRefresh = false;
  state.setNeedRefresh.mockClear();
  state.update.mockClear();
});

describe("UpdateToast (NFR-11)", () => {
  it("shows nothing when there is no new version", () => {
    render(<UpdateToast />);
    expect(screen.queryByTestId("update-toast")).toBeNull();
  });
  it("shows the message and reloads on request", async () => {
    state.needRefresh = true;
    const user = userEvent.setup();
    render(<UpdateToast />);
    expect(screen.getByText("New version ready. Reload.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reload" }));
    expect(state.update).toHaveBeenCalledWith(true);
  });
  it("can be dismissed with Later", async () => {
    state.needRefresh = true;
    const user = userEvent.setup();
    render(<UpdateToast />);
    await user.click(screen.getByRole("button", { name: "Later" }));
    expect(state.setNeedRefresh).toHaveBeenCalledWith(false);
  });
});
