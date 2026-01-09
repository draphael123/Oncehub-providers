import { notFound } from "next/navigation";
import { loadProgramData, loadExclusions } from "@/lib/data";
import { normalizeProgram } from "@/lib/route";
import { AllUsersClient } from "./AllUsersClient";

interface PageProps {
  params: Promise<{
    program: string;
  }>;
}

export default async function AllUsersPage({ params }: PageProps) {
  const { program: programParam } = await params;
  
  const program = normalizeProgram(programParam);
  if (!program) {
    notFound();
  }

  const resourcePools = loadProgramData(program);
  const exclusions = loadExclusions();

  return (
    <AllUsersClient
      program={program}
      resourcePools={resourcePools}
      serverExclusions={exclusions}
    />
  );
}

export async function generateStaticParams() {
  return [{ program: "hrt" }, { program: "trt" }];
}

