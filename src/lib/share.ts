import { Platform, Share } from "react-native";

export type ShareScreenshotInput = {
  uri: string;
  title?: string | null;
  message?: string | null;
};

export async function shareScreenshot({ uri, title, message }: ShareScreenshotInput): Promise<boolean> {
  const text = [title, message].filter((part): part is string => !!part?.trim()).join("\n");
  const content =
    Platform.OS === "ios"
      ? { url: uri, ...(text ? { message: text } : {}), ...(title ? { title } : {}) }
      : { message: text || uri, ...(title ? { title } : {}) };
  const result = await Share.share(content, title ? { subject: title, dialogTitle: title } : undefined);
  return result.action === Share.sharedAction;
}
