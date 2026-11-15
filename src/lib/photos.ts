import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import {
  Album,
  type Asset,
  AssetField,
  getPermissionsAsync,
  MediaSubtype,
  MediaType,
  presentPermissionsPicker,
  Query,
  requestPermissionsAsync,
} from "expo-media-library";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { AppState, Linking } from "react-native";
import { DEV_TOOLS, READ_ALL_PHOTOS_DEFAULT } from "./dev-flags";

export { DEV_TOOLS };

export type PhotoAccess = "undetermined" | "denied" | "limited" | "full";

function toAccess(res: { granted: boolean; canAskAgain: boolean; accessPrivileges?: string }): PhotoAccess {
  if (res.granted) return res.accessPrivileges === "limited" ? "limited" : "full";
  return res.canAskAgain ? "undetermined" : "denied";
}

export async function getPhotoAccess(): Promise<PhotoAccess> {
  return toAccess(await getPermissionsAsync(false, ["photo"]));
}

export async function requestPhotoAccess(): Promise<PhotoAccess> {
  return toAccess(await requestPermissionsAsync(false, ["photo"]));
}

export function hasPhotoAccess(access: PhotoAccess | null) {
  return access === "full" || access === "limited";
}

// access is null until the first read. It re-reads whenever the app returns to the foreground,
// so a change made in Settings shows up without a restart.
export function usePhotoAccess() {
  const [access, setAccess] = useState<PhotoAccess | null>(null);
  const refresh = useCallback(async () => {
    const next = await getPhotoAccess().catch(() => "undetermined" as const);
    setAccess(next);
    return next;
  }, []);
  useEffect(() => {
    void refresh();
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") void refresh();
    });
    return () => sub.remove();
  }, [refresh]);
  const request = useCallback(async () => {
    const next = await requestPhotoAccess().catch(() => "denied" as const);
    setAccess(next);
    return next;
  }, []);
  const openLimitedPicker = useCallback(async () => {
    await presentPermissionsPicker(["photo"]);
    await refresh();
  }, [refresh]);
  const openSettings = useCallback(() => Linking.openSettings(), []);
  return { access, request, refresh, openLimitedPicker, openSettings };
}

// Dev switch: read every photo instead of only the Screenshots album (simulators have no screenshots).
let readAllPhotos = READ_ALL_PHOTOS_DEFAULT;
const readAllListeners = new Set<() => void>();
export function getReadAllPhotos() {
  return readAllPhotos;
}
export function setReadAllPhotos(value: boolean) {
  readAllPhotos = value;
  readAllListeners.forEach((l) => l());
}
export function useReadAllPhotos(): [boolean, (value: boolean) => void] {
  const value = useSyncExternalStore(
    (l) => {
      readAllListeners.add(l);
      return () => readAllListeners.delete(l);
    },
    getReadAllPhotos,
  );
  return [value, setReadAllPhotos];
}

// Newest first. The Screenshots album on iOS is the set of images with the screenshot subtype.
export async function listCandidates(readAll: boolean, limit: number): Promise<Asset[]> {
  if (limit <= 0) return [];
  let query = new Query().eq(AssetField.MEDIA_TYPE, MediaType.IMAGE);
  if (!readAll) query = query.contains(AssetField.MEDIA_SUBTYPES, MediaSubtype.SCREENSHOT);
  return await query.orderBy({ key: AssetField.CREATION_TIME, ascending: false }).limit(limit).exe();
}

export type LibraryDiagnostics = {
  smartAlbums: string[];
  screenshotsAlbumCount: number | null;
  screenshotSubtypeCount: number;
  allImagesCount: number;
};

export async function getLibraryDiagnostics(): Promise<LibraryDiagnostics> {
  const albums = await Album.getSmartAlbums();
  const titles = await Promise.all(albums.map((a) => a.getTitle()));
  const index = titles.findIndex((t) => t === "Screenshots");
  const [screenshotsAlbumCount, subtype, all] = await Promise.all([
    index >= 0 ? albums[index].getAssetCount() : Promise.resolve(null),
    listCandidates(false, 1000),
    listCandidates(true, 1000),
  ]);
  return {
    smartAlbums: titles,
    screenshotsAlbumCount,
    screenshotSubtypeCount: subtype.length,
    allImagesCount: all.length,
  };
}

// null while loading, a string when it failed. Only reads the library when DEV_TOOLS is on.
export function useLibraryDiagnostics(): LibraryDiagnostics | string | null {
  const [diag, setDiag] = useState<LibraryDiagnostics | string | null>(null);
  useEffect(() => {
    if (!DEV_TOOLS) return;
    getLibraryDiagnostics().then(setDiag, (e: unknown) => setDiag(String(e)));
  }, []);
  return diag;
}

const MAX_WIDTH = 1080;

// Resizes to at most 1080px wide and re-encodes as JPEG before upload.
export async function prepareForUpload(asset: Asset) {
  const [uri, width, takenAt] = await Promise.all([
    asset.getUri(),
    asset.getWidth(),
    asset.getCreationTime(),
  ]);
  const context = ImageManipulator.manipulate(uri);
  if (width > MAX_WIDTH) context.resize({ width: MAX_WIDTH });
  const image = await context.renderAsync();
  const result = await image.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
  return { uri: result.uri, takenAt: takenAt ?? Date.now() };
}
