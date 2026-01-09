import { notFound } from "next/navigation";
import { loadProgramData, loadExclusions } from "@/lib/data";
import { normalizeProgram, decodeStateParam } from "@/lib/route";
import { StateDetailClient } from "./StateDetailClient";

interface PageProps {
  params: Promise<{
    program: string;
    state: string;
  }>;
}

export default async function StateDetailPage({ params }: PageProps) {
  const { program: programParam, state: stateParam } = await params;
  
  const program = normalizeProgram(programParam);
  if (!program) {
    notFound();
  }

  const state = decodeStateParam(stateParam);
  const resourcePools = loadProgramData(program);
  const pool = resourcePools.find((p) => p.state === state);

  if (!pool) {
    notFound();
  }

  const exclusions = loadExclusions();

  return (
    <StateDetailClient
      pool={pool}
      serverExclusions={exclusions}
    />
  );
}

export async function generateStaticParams() {
  // We can't pre-generate all states since data may change
  // Return empty array to use dynamic rendering
  return [];
}

