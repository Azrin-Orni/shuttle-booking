import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Don't intercept /auth/me or /auth/refresh — these are used during
    // initialization and token refresh. Intercepting them causes redirect loops.
    const skipUrls = ['/auth/me', '/auth/refresh', '/auth/login', '/auth/register'];
    const isSkipped = skipUrls.some((url) => original.url?.includes(url));

    if (error.response?.status === 401 && !original._retry && !isSkipped) {
      original._retry = true;
      try {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        return api(original);
      } catch {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;