import { API_BASE } from "../../helpers/constants";

export async function action({ request }) {
  const formData = await request.formData();
  const payload = {
    username: formData.get("username"),
    password: formData.get("password"),
  };

  const response = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return { ok: false, status: response.status };
  }
  return response.json();
}
