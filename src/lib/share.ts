import { Platform, Share } from "react-native";

export type ShareScreenshotInput = {
  uri?: string | null;
  title?: string | null;
  message?: string | null;
};

// uri is optional on purpose: a screenshot with no local file is shared as its reading only.
export async function shareScreenshot({ uri, title, message }: ShareScreenshotInput): Promise<boolean> {
  const text = [title, message].filter((part): part is string => !!part?.trim()).join("\n");
  if (!uri && !text) return false;
  const content =
    Platform.OS === "ios" && uri
      ? { url: uri, ...(text ? { message: text } : {}), ...(title ? { title } : {}) }
      : { message: text || uri!, ...(title ? { title } : {}) };
  const result = await Share.share(content, title ? { subject: title, dialogTitle: title } : undefined);
  return result.action === Share.sharedAction;
}
