import { getAllProgramData } from "@/lib/data";
import { CombinedClient } from "./CombinedClient";

export default function CombinedPage() {
  const { hrt, trt, exclusions } = getAllProgramData();

  return (
    <CombinedClient
      hrtPools={hrt}
      trtPools={trt}
      serverExclusions={exclusions}
    />
  );
}

