import { getAllProgramData } from "@/lib/data";
import { ReportsClient } from "./ReportsClient";

export default function ReportsPage() {
  const { hrt, trt, exclusions } = getAllProgramData();

  return (
    <ReportsClient
      hrtPools={hrt}
      trtPools={trt}
      serverExclusions={exclusions}
    />
  );
}

