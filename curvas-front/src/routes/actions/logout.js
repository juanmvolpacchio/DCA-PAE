import { API_BASE } from "../../helpers/constants";

export async function action({ request }) {
  await fetch(`${API_BASE}/logout`, {
    method: "POST",
  });
  return null;
}
