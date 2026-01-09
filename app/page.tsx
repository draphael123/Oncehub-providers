import { getAllProgramData } from "@/lib/data";
import { DashboardClient } from "./DashboardClient";

export default function DashboardPage() {
  const { hrt, trt, exclusions } = getAllProgramData();

  return (
    <DashboardClient
      hrtPools={hrt}
      trtPools={trt}
      serverExclusions={exclusions}
    />
  );
}
