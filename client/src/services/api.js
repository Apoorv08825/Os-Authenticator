const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://os-authenticator.onrender.com/api";

export const apiRequest = async (path, options = {}) => {
  const token = options.token || localStorage.getItem("secure_auth_token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Unexpected API request error.");
  }

  return data;
};

export { API_BASE_URL };
