import { NextResponse } from "next/server";
import { z } from "zod";
import {
  listDatasets,
  listDataPackages,
  searchDatasets,
  getDatasetFileTree,
  isAihubConfigured,
} from "@/lib/aihub/client";

const querySchema = z.object({
  keyword: z.string().max(100).optional(),
  datasetkey: z.coerce.number().int().positive().optional(),
  type: z.enum(["dataset", "package"]).default("dataset"),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    keyword: searchParams.get("keyword") ?? undefined,
    datasetkey: searchParams.get("datasetkey") ?? undefined,
    type: searchParams.get("type") ?? "dataset",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "잘못된 요청입니다.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { keyword, datasetkey, type } = parsed.data;

  try {
    if (datasetkey) {
      const tree = await getDatasetFileTree(datasetkey);
      return NextResponse.json({
        datasetkey,
        fileTree: tree,
        configured: isAihubConfigured(),
      });
    }

    if (keyword) {
      const keywords = keyword.split(/[\s,]+/).filter(Boolean);
      const results = await searchDatasets(keywords, 20);
      return NextResponse.json({
        count: results.length,
        datasets: results,
        configured: isAihubConfigured(),
      });
    }

    if (type === "package") {
      const packages = await listDataPackages();
      return NextResponse.json({
        count: packages.length,
        packages,
        configured: isAihubConfigured(),
      });
    }

    const datasets = await listDatasets();
    return NextResponse.json({
      count: datasets.length,
      datasets,
      configured: isAihubConfigured(),
    });
  } catch (error) {
    console.error("AI HUB API error:", error);
    return NextResponse.json(
      { error: "AI HUB 데이터 조회에 실패했습니다." },
      { status: 502 }
    );
  }
}
