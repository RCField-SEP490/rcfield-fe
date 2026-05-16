import axios from "axios"
import { env } from "./env"

export const api = axios.create({
  baseURL: env.apiUrl,
  withCredentials: true,
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // TODO: handle refresh token / force logout when backend auth contract is ready.
    return Promise.reject(error)
  },
)
