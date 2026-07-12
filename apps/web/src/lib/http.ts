import axios from 'axios';

const FRIENDLY: Record<number, string> = {
  401: "Your session has expired. Please sign in again.",
  403: "You don't have access to this. Contact your Fleet Manager.",
  404: "The requested record was not found.",
  409: "This record already exists.",
  422: "The submitted data is invalid. Please check your inputs.",
  500: "Something went wrong on our end. Please try again.",
};

const http = axios.create({ baseURL: '/api' });

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const status: number | undefined = err?.response?.status;
    if (status && FRIENDLY[status]) {
      err.response.data = { message: FRIENDLY[status] };
    } else if (!err?.response && !navigator.onLine) {
      err.message = 'You appear to be offline. Check your connection.';
    }
    return Promise.reject(err);
  }
);

export default http;
