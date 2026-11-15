import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import {
  Album,
  type Asset,
  AssetField,
  getPermissionsAsync,
  MediaSubtype,
  MediaType,
  Query,
  requestPermissionsAsync,
} from "expo-media-library";

export type PhotoAccess = "all" | "limited" | "denied" | "undetermined";

function toAccess(res: { granted: boolean; canAskAgain: boolean; accessPrivileges?: string }): PhotoAccess {
  if (res.granted) return res.accessPrivileges === "limited" ? "limited" : "all";
  return res.canAskAgain ? "undetermined" : "denied";
}

export async function getPhotoAccess() {
  return toAccess(await getPermissionsAsync(false, ["photo"]));
}

export async function requestPhotoAccess() {
  return toAccess(await requestPermissionsAsync(false, ["photo"]));
}

// Newest first. The Screenshots album on iOS is the set of images with the screenshot subtype.
export async function listCandidates(readAllPhotos: boolean, limit: number): Promise<Asset[]> {
  let query = new Query().eq(AssetField.MEDIA_TYPE, MediaType.IMAGE);
  if (!readAllPhotos) query = query.contains(AssetField.MEDIA_SUBTYPES, MediaSubtype.SCREENSHOT);
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
