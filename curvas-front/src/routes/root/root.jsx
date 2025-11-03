import { useQuery } from "@tanstack/react-query";
import { Outlet, useParams } from "react-router-dom";
import { API_BASE } from "../../helpers/constants";
import { useAuth } from "../../hooks/useAuth";
import { useWell } from "../../hooks/useWell";

// import logo from '/src/assets/icon.png';
import LoginButton from "../../components/LoginButton/LoginButton";
import WellSelectorBar from "../../components/WellSelectorBar/WellSelectorBar";
import "./root.css";

export default function MainScreen() {
  const { user } = useAuth();
  const { well } = useParams();
  const { well: activeWell } = useWell();

  const { data: wellsData } = useQuery({
    queryKey: ["wells"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/wells`);
      if (!response.ok) throw new Error("Failed to load wells");
      const json = await response.json();
      return json.wells;
    },
    staleTime: 60_000,
  });

  const wells = (wellsData || []).toSorted((w1, w2) => {
    // Check if the 'name' property exists on both objects
    const name1 = w1?.name?.toLowerCase() || "";
    const name2 = w2?.name?.toLowerCase() || "";

    if (name1 < name2) {
      return -1;
    }
    if (name1 > name2) {
      return 1;
    }
    return 0; // names are equal
  });

  return (
    <>
      <header>
        {/* <img src={ logo } alt="logo"/> */}
        <h1>{activeWell?.name || "Seleccione un pozo"}</h1>
        <LoginButton />
        {/* <span 
                    className="material-symbols-rounded"
                    onClick={ window.winHandlers.exit }
                >close_small</span> */}
      </header>
      <div id="main-container">
        <WellSelectorBar wells={wells} user={user} />
        <div id="main-panel-container">
          <Outlet context={{ user, activeWell }} />
        </div>
      </div>
    </>
  );
}
