export interface AihubDatasetEntry {
  datasetKey: number;
  title: string;
}

export interface AihubDataPackageEntry {
  packageKey: number;
  title: string;
}

export interface AihubFileEntry {
  path: string;
  fileName: string;
  size: string;
  fileKey: number;
}

export type AihubListMode = "dataset" | "datapackage";
export type AihubDownloadMode = "dataset" | "datapackage";
