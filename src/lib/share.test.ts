import { beforeEach, describe, expect, test, vi } from "vitest";
import { shareScreenshot } from "./share";

const platform = vi.hoisted(() => ({ OS: "ios" }));
const share = vi.hoisted(() => vi.fn());

vi.mock("react-native", () => ({
  Platform: platform,
  Share: { share, sharedAction: "sharedAction", dismissedAction: "dismissedAction" },
}));

beforeEach(() => {
  share.mockReset();
  share.mockResolvedValue({ action: "sharedAction" });
  platform.OS = "ios";
});

describe("shareScreenshot", () => {
  test("iOS shares the local file with the reading as text", async () => {
    await expect(
      shareScreenshot({ uri: "file:///shot.png", title: "Pottery night", message: "Sign-up closes Fri, Nov 20" }),
    ).resolves.toBe(true);
    expect(share).toHaveBeenCalledWith(
      { url: "file:///shot.png", message: "Pottery night\nSign-up closes Fri, Nov 20", title: "Pottery night" },
      { subject: "Pottery night", dialogTitle: "Pottery night" },
    );
  });

  test("iOS with only a uri shares just the file", async () => {
    await shareScreenshot({ uri: "file:///shot.png" });
    expect(share).toHaveBeenCalledWith({ url: "file:///shot.png" }, undefined);
  });

  test("blank title and message are dropped", async () => {
    await shareScreenshot({ uri: "file:///shot.png", title: null, message: "  " });
    expect(share).toHaveBeenCalledWith({ url: "file:///shot.png" }, undefined);
  });

  test("Android shares text, since Share has no url there", async () => {
    platform.OS = "android";
    await shareScreenshot({ uri: "file:///shot.png", message: "Energy bill due Nov 21" });
    expect(share).toHaveBeenCalledWith({ message: "Energy bill due Nov 21" }, undefined);
  });

  test("Android with no text falls back to the uri", async () => {
    platform.OS = "android";
    await shareScreenshot({ uri: "file:///shot.png" });
    expect(share).toHaveBeenCalledWith({ message: "file:///shot.png" }, undefined);
  });

  test("returns false when the sheet is dismissed", async () => {
    share.mockResolvedValue({ action: "dismissedAction" });
    await expect(shareScreenshot({ uri: "file:///shot.png" })).resolves.toBe(false);
  });

  test("passes Share errors through", async () => {
    share.mockRejectedValue(new Error("boom"));
    await expect(shareScreenshot({ uri: "file:///shot.png" })).rejects.toThrow("boom");
  });

  test("without a uri only the reading is shared", async () => {
    await shareScreenshot({ title: "Pottery night", message: "Sign-up closes Fri, Nov 20" });
    expect(share).toHaveBeenCalledWith(
      { message: "Pottery night\nSign-up closes Fri, Nov 20", title: "Pottery night" },
      { subject: "Pottery night", dialogTitle: "Pottery night" },
    );
  });

  test("with no uri and no text there is nothing to share", async () => {
    await expect(shareScreenshot({ uri: null, title: " ", message: null })).resolves.toBe(false);
    expect(share).not.toHaveBeenCalled();
  });
});
