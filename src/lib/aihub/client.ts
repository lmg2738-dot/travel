/**
 * AI HUB Open API 클라이언트
 * aihubshell 스펙 기반 HTTP 연동
 * @see https://aihub.or.kr/devsport/apishell/list.do
 *
 * 엔드포인트 (aihubshell v0.6 기준):
 * - GET  /info/dataset.do          데이터셋 목록
 * - GET  /info/{datasetkey}.do     데이터셋 파일 트리
 * - GET  /info/datapckage.do       데이터패키지 목록
 * - GET  /info/pckage/{key}.do     데이터패키지 파일 트리
 * - GET  /down/0.6/{datasetkey}.do 다운로드 (Header: apikey)
 */

import type {
  AihubDatasetEntry,
  AihubDataPackageEntry,
  AihubFileEntry,
} from "./types";

const DEFAULT_BASE_URL = "https://api.aihub.or.kr";
const DOWNLOAD_VERSION = "0.6";
const AIHUB_FETCH_TIMEOUT_MS = 5_000;

function getBaseUrl(): string {
  return process.env.AIHUB_API_BASE_URL ?? DEFAULT_BASE_URL;
}

function getApiKey(): string | undefined {
  return process.env.AIHUB_API_KEY;
}

/** 데이터셋 목록 파싱: "593, 지능형 스마트양식장..." 형식 */
export function parseDatasetList(raw: string): AihubDatasetEntry[] {
  const results: AihubDatasetEntry[] = [];

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    const match = trimmed.match(/^(\d+)\s*,\s*(.+)$/);
    if (match) {
      results.push({
        datasetKey: parseInt(match[1], 10),
        title: match[2].trim(),
      });
    }
  }

  return results;
}

/** 데이터패키지 목록 파싱 */
export function parseDataPackageList(raw: string): AihubDataPackageEntry[] {
  const results: AihubDataPackageEntry[] = [];

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    const match = trimmed.match(/^(\d+)\s*,\s*(.+)$/);
    if (match) {
      results.push({
        packageKey: parseInt(match[1], 10),
        title: match[2].trim(),
      });
    }
  }

  return results;
}

/** 파일 트리에서 filekey 추출: "TL1.zip | 108 MB | 51937" */
export function parseFileTree(raw: string): AihubFileEntry[] {
  const results: AihubFileEntry[] = [];
  const fileLinePattern = /^(.+\/)?([^|]+)\s*\|\s*([^|]+)\s*\|\s*(\d+)\s*$/;

  for (const line of raw.split("\n")) {
    const trimmed = line.replace(/[├└│─\s]+/g, " ").trim();
    const match = trimmed.match(fileLinePattern);
    if (match) {
      results.push({
        path: (match[1] ?? "").trim(),
        fileName: match[2].trim(),
        size: match[3].trim(),
        fileKey: parseInt(match[4], 10),
      });
    }
  }

  return results;
}

/** 키워드로 데이터셋 필터링 */
export function filterByKeywords(
  datasets: AihubDatasetEntry[],
  keywords: string[]
): AihubDatasetEntry[] {
  if (keywords.length === 0) return datasets;

  return datasets.filter((d) => {
    const text = d.title.toLowerCase();
    return keywords.some(
      (kw) => text.includes(kw.toLowerCase()) || d.title.includes(kw)
    );
  });
}

/** -mode l: 개방 데이터셋 목록 조회 (API key 불필요) */
export async function listDatasets(): Promise<AihubDatasetEntry[]> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/info/dataset.do`, {
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(AIHUB_FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`AI HUB 데이터셋 목록 조회 실패: HTTP ${response.status}`);
  }

  const text = await response.text();
  return parseDatasetList(text);
}

/** -mode l -datasetkey {key}: 데이터셋 파일 트리 조회 */
export async function getDatasetFileTree(datasetKey: number): Promise<string> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/info/${datasetKey}.do`, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(
      `AI HUB 파일 트리 조회 실패 (dataset ${datasetKey}): HTTP ${response.status}`
    );
  }

  return response.text();
}

/** -mode pl: 데이터패키지 목록 조회 */
export async function listDataPackages(): Promise<AihubDataPackageEntry[]> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/info/datapckage.do`, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(
      `AI HUB 데이터패키지 목록 조회 실패: HTTP ${response.status}`
    );
  }

  const text = await response.text();
  return parseDataPackageList(text);
}

/** -mode pl -datapckagekey {key}: 데이터패키지 파일 트리 */
export async function getDataPackageFileTree(
  packageKey: number
): Promise<string> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/info/pckage/${packageKey}.do`, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(
      `AI HUB 패키지 파일 트리 조회 실패 (package ${packageKey}): HTTP ${response.status}`
    );
  }

  return response.text();
}

/**
 * -mode d: 데이터셋 다운로드 URL 생성
 * 실제 다운로드는 승인된 데이터셋만 가능 (aihubapikey 필수)
 */
export function getDatasetDownloadUrl(
  datasetKey: number,
  fileKey: string | number = "all"
): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/down/${DOWNLOAD_VERSION}/${datasetKey}.do?fileSn=${fileKey}`;
}

export function getDataPackageDownloadUrl(
  packageKey: number,
  fileKey: string | number = "all"
): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/down/pckage/${DOWNLOAD_VERSION}/${packageKey}.do?fileSn=${fileKey}`;
}

/** API key 유효성 확인 (다운로드 헤더 인증 테스트) */
export async function validateApiKey(): Promise<boolean> {
  const apiKey = getApiKey();
  if (!apiKey) return false;

  try {
    const datasets = await listDatasets();
    if (datasets.length === 0) return false;

    const testKey = datasets[0].datasetKey;
    const url = getDatasetDownloadUrl(testKey, "all");
    const response = await fetch(url, {
      method: "HEAD",
      headers: { apikey: apiKey },
    });

    return response.status !== 401 && response.status !== 403;
  } catch {
    return false;
  }
}

/** 키워드 검색 + 관련도 점수 */
export async function searchDatasets(
  keywords: string[],
  limit = 10
): Promise<Array<AihubDatasetEntry & { relevanceScore: number }>> {
  const all = await listDatasets();
  const filtered = filterByKeywords(all, keywords);

  return filtered
    .map((d) => {
      const text = d.title.toLowerCase();
      const matchCount = keywords.filter(
        (kw) => text.includes(kw.toLowerCase()) || d.title.includes(kw)
      ).length;
      return {
        ...d,
        relevanceScore: matchCount / keywords.length,
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);
}

export function isAihubConfigured(): boolean {
  return Boolean(getApiKey());
}
