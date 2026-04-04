import { getStoredToken } from "./session.js";

const DEFAULT_API_BASE_URL = import.meta.env.PROD ? "" : "http://localhost:5001";

export class ApiError extends Error {
 constructor(message, status, details) {
  super(message);
  this.name = "ApiError";
  this.status = status;
  this.details = details;
 }
}

export const API_BASE_URL = (
 import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL
).replace(/\/$/, "");

const getApiUrl = (path) => {
 if (/^https?:\/\//i.test(path)) {
  return path;
 }

 return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

const getResponsePayload = async (response) => {
 const contentType = response.headers.get("content-type") || "";

 if (contentType.includes("application/json")) {
  return response.json();
 }

 const text = await response.text();
 return text ? { message: text } : null;
};

export async function fetchJson(path, options = {}) {
 const {
  body,
  headers,
  method = "GET",
  signal,
  timeout = 15000,
  ...rest
 } = options;
 const controller = new AbortController();
 const timeoutId = window.setTimeout(() => controller.abort(), timeout);

 try {
  const response = await fetch(getApiUrl(path), {
   ...rest,
   method,
   headers: {
    ...(body ? { "Content-Type": "application/json" } : {}),
    ...(getStoredToken() ? { Authorization: `Bearer ${getStoredToken()}` } : {}),
    ...headers,
   },
   body: body
    ? typeof body === "string"
      ? body
      : JSON.stringify(body)
    : undefined,
   signal: signal || controller.signal,
  });

  const payload = await getResponsePayload(response);

  if (!response.ok) {
   throw new ApiError(
    payload?.message || "Request failed. Please try again.",
    response.status,
    payload,
   );
  }

  return payload;
 } catch (error) {
  if (error.name === "AbortError") {
   throw new ApiError("The request timed out. Please try again.", 408);
  }

  if (error instanceof ApiError) {
   throw error;
  }

  throw new ApiError(
   error.message || "Unable to reach the server. Please try again.",
   500,
  );
 } finally {
  window.clearTimeout(timeoutId);
 }
}

export function getErrorMessage(error, fallback = "Something went wrong.") {
 if (error instanceof ApiError) {
  return error.message;
 }

 return error?.message || fallback;
}
