import axios from "axios";

/* ---------------- CSRF helper ---------------- */
function getCookie(name) {
  let cookieValue = null;

  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");

    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.startsWith(name + "=")) {
        cookieValue = decodeURIComponent(cookie.slice(name.length + 1));
        break;
      }
    }
  }

  return cookieValue;
}

/* ---------------- Axios instance ---------------- */
const api = axios.create({
  baseURL: "/api",
  withCredentials: true, // REQUIRED for CSRF cookies
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/* ---------------- Request interceptor ---------------- */
api.interceptors.request.use(
  (config) => {
    // Attach auth token
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }

    // Attach CSRF token for unsafe methods
    if (!/^(get|head|options|trace)$/i.test(config.method)) {
      const csrfToken = getCookie("csrftoken");
      if (csrfToken) {
        config.headers["X-CSRFToken"] = csrfToken;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
