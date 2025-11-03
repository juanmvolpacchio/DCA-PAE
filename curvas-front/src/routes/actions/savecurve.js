import { API_BASE } from "../../helpers/constants";

export async function action({ request }) {
  const formData = await request.formData();
  const payload = {
    name: formData.get("name"),
    qo: Number(formData.get("qo")),
    dea: Number(formData.get("dea")),
    t: Number(formData.get("t")),
    well: formData.get("well"),
    user_id: Number(formData.get("user_id")),
  };

  await fetch(`${API_BASE}/curves`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return null;
}
