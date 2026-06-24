/**
 * AI HUB 관광/여행 데이터 연동
 * aihubshell -mode l 기반 실제 데이터셋 목록 활용
 */

import {
  listDatasets,
  filterByKeywords,
  getDatasetFileTree,
  parseFileTree,
  searchDatasets,
} from "./client";

export interface AihubDataset {
  id: string;
  datasetKey: number;
  title: string;
  description: string;
  category: string;
  relevanceScore: number;
  fileCount?: number;
}

const TOURISM_KEYWORDS = [
  "관광",
  "여행",
  "숙박",
  "맛집",
  "음식",
  "축제",
  "문화",
  "레저",
  "호텔",
  "관광지",
  "여행지",
  "지역",
  "명소",
  "tourism",
  "travel",
];

const CATEGORY_RULES: { category: string; keywords: string[] }[] = [
  { category: "관광", keywords: ["관광", "여행", "명소", "여행지"] },
  { category: "음식", keywords: ["음식", "맛집", "요리", "식당"] },
  { category: "숙박", keywords: ["숙박", "호텔", "펜션"] },
  { category: "문화", keywords: ["문화", "축제", "전통", "유적"] },
  { category: "레저", keywords: ["레저", "스포츠", "체험"] },
];

function inferCategory(title: string): string {
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((kw) => title.includes(kw))) {
      return rule.category;
    }
  }
  return "관광";
}

function buildSearchKeywords(destination: string): string[] {
  return ["관광", "여행", destination];
}

export async function searchTourismDatasets(
  destination: string
): Promise<AihubDataset[]> {
  try {
    const keywords = buildSearchKeywords(destination);
    const results = await searchDatasets(keywords, 3);

    if (results.length > 0) {
      return results.map((d) => ({
        id: String(d.datasetKey),
        datasetKey: d.datasetKey,
        title: d.title,
        description: `AI HUB 개방 데이터셋 #${d.datasetKey}`,
        category: inferCategory(d.title),
        relevanceScore: d.relevanceScore,
      }));
    }

    const all = await listDatasets();
    const tourismOnly = filterByKeywords(all, TOURISM_KEYWORDS).slice(0, 5);

    if (tourismOnly.length > 0) {
      return tourismOnly.map((d, i) => ({
        id: String(d.datasetKey),
        datasetKey: d.datasetKey,
        title: d.title,
        description: `AI HUB 개방 데이터셋 #${d.datasetKey}`,
        category: inferCategory(d.title),
        relevanceScore: 0.8 - i * 0.1,
      }));
    }

    return getFallbackTourismInsights(destination);
  } catch (error) {
    console.error("AI HUB 데이터셋 조회 실패:", error);
    return getFallbackTourismInsights(destination);
  }
}

/** 상위 데이터셋의 파일 구조 요약 (GPT 컨텍스트용) */
export async function getDatasetContextSummary(
  datasetKey: number
): Promise<string> {
  try {
    const tree = await getDatasetFileTree(datasetKey);
    const files = parseFileTree(tree);

    if (files.length === 0) {
      return tree.split("\n").slice(0, 15).join("\n");
    }

    const summary = files
      .slice(0, 5)
      .map((f) => `- ${f.fileName} (${f.size}, filekey: ${f.fileKey})`)
      .join("\n");

    return `파일 ${files.length}개 중 주요 파일:\n${summary}`;
  } catch {
    return "";
  }
}

function getFallbackTourismInsights(destination: string): AihubDataset[] {
  return [
    {
      id: "fallback-1",
      datasetKey: 0,
      title: `${destination} 관광 정보 (AI HUB 폴백)`,
      description: `${destination} 지역 관광·맛집·숙박 추천용 일반 데이터`,
      category: "관광",
      relevanceScore: 0.5,
    },
  ];
}

export function formatAihubContext(datasets: AihubDataset[]): string {
  if (datasets.length === 0) return "";

  return datasets
    .map((d) => {
      const keyInfo =
        d.datasetKey > 0 ? ` [datasetkey: ${d.datasetKey}]` : "";
      return `[AI HUB 데이터]${keyInfo} ${d.title}: ${d.description} (카테고리: ${d.category})`;
    })
    .join("\n");
}

export function extractAihubInsights(datasets: AihubDataset[]): string[] {
  return datasets.map((d) => {
    if (d.datasetKey > 0) {
      return `AI HUB #${d.datasetKey} ${d.category} 데이터: ${d.title}`;
    }
    return `AI HUB ${d.category} 데이터 기반: ${d.title}`;
  });
}
