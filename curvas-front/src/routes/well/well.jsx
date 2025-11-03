import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import DeclinAnalysisPanel from "../../components/DeclinAnalysisPanel/DeclinAnalysisPanel";
import { API_BASE } from "../../helpers/constants";

// Utility function to group by month and sum numeric columns
function groupByMonthAndSum(data) {
  if (!data || !data.length) return [];

  // Convert a date to YYYY-MM format
  const parseMonth = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  const grouped = {};

  for (const row of data) {
    const month = parseMonth(row.date || row.month);
    if (!grouped[month]) grouped[month] = { month };

    for (const key in row) {
      const value = row[key];
      if (key === "date" || key === "month") continue;
      if (typeof value === "number") {
        grouped[month][key] = (grouped[month][key] || 0) + value;
      }
    }
  }

  return Object.values(grouped);
}

export default function WellScreen() {
  const { well } = useParams();

  const { data: wellProdSeries } = useQuery({
    queryKey: ["well", well, "prod"],
    queryFn: async () => {
      const endpoint = well
        ? `${API_BASE}/wells/${encodeURIComponent(well)}/prod`
        : `${API_BASE}/wells/wellsprod`;

      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Failed to load production data");
      const json = await res.json();

      // Group by month only if no well selected
      return well ? json : groupByMonthAndSum(json);
    },
    enabled: true, // allow fetching even when no well is selected
    staleTime: 60_000,
  });

  if (!wellProdSeries) {
    return "Loading...";
  }

  return (
    <DeclinAnalysisPanel
      key={wellProdSeries?.well || well || "all_wells"}
      wellProdSeries={wellProdSeries}
    />
  );
}
