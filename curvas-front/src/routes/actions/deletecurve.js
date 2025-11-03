import { API_BASE } from "../../helpers/constants";

export async function action({ request }) {
  const formData = await request.formData();
  const payload = {
    name: formData.get("name"),
    well: formData.get("well"),
  };

  await fetch(`${API_BASE}/curves`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return null;
}
