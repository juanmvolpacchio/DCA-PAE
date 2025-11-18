import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import DeclinAnalysisPanel from "../../components/DeclinAnalysisPanel/DeclinAnalysisPanel";
import { API_BASE } from "../../helpers/constants";

export default function WellScreen() {
  const { projectName, wellNames } = useParams();

  const { data: wellProdSeries } = useQuery({
    queryKey: ["project", projectName, "wells", wellNames, "prod"],
    queryFn: async () => {
      if (!projectName) {
        throw new Error("projectName is required");
      }

      const endpoint = wellNames
        ? `${API_BASE}/projects/${encodeURIComponent(projectName)}/wells/${encodeURIComponent(wellNames)}/prod`
        : `${API_BASE}/projects/${encodeURIComponent(projectName)}/wells/prod`;

      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Failed to load production data");
      return await res.json();
    },
    enabled: !!projectName,
    staleTime: 60_000,
  });

  if (!wellProdSeries) {
    return "Loading...";
  }

  return (
    <DeclinAnalysisPanel
      key={wellProdSeries?.well || wellNames || projectName || "wells"}
      wellProdSeries={wellProdSeries}
    />
  );
}
