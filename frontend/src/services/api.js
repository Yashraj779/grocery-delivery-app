import axios from "axios";
import { TOKEN_STORAGE_KEY } from "../constants/auth";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const unwrap = async (requestPromise) => {
  try {
    const response = await requestPromise;
    return response.data;
  } catch (error) {
    const isNetworkError = error?.message === "Network Error" && !error?.response;
    if (isNetworkError) {
      throw new Error(
        "Cannot connect to API Gateway (http://localhost:5000). Start api-gateway and auth-service.",
      );
    }

    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Network error. Check if services are running.";

    throw new Error(message);
  }
};

export const registerUser = (payload) => unwrap(apiClient.post("/auth/register", payload));
export const loginUser = (payload) => unwrap(apiClient.post("/auth/login", payload));

export const getProducts = () => unwrap(apiClient.get("/products"));
export const getCart = () => unwrap(apiClient.get("/cart"));
export const placeOrder = () => unwrap(apiClient.post("/order", {}));
export const addToCart = (product) => unwrap(apiClient.post("/cart", product));
export const removeCartItem = (productId) => unwrap(apiClient.post("/cart/remove", { productId }));

export const updateCartItem = (productId, operation) => {
  if (!["increment", "decrement"].includes(operation)) {
    throw new Error("Invalid operation");
  }

  return unwrap(apiClient.post("/cart/update", { productId, operation }));
};

export const getDelivery = (orderId) => {
  if (typeof orderId !== "number") {
    throw new Error("Valid orderId required");
  }

  return unwrap(apiClient.get(`/delivery?orderId=${orderId}`));
};

export const updateDelivery = (orderId) => {
  if (typeof orderId !== "number") {
    throw new Error("Valid orderId required");
  }

  return unwrap(apiClient.post("/delivery/update", { orderId }));
};