import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const API_TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT || '30000');

interface ApiResponse<T> {
  data: T;
  status: number;
}

interface TokensResponse {
  refresh: string;
  access: string;
}

interface UserResponse {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'student' | 'teacher' | 'admin';
  avatar?: string;
  bio?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  password: string;
  password_confirm: string;
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.api.interceptors.request.use((config) => {
      const token = this.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && originalRequest) {
          const refreshToken = this.getRefreshToken();
          if (refreshToken) {
            try {
              const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
                refresh: refreshToken,
              });

              const { access } = response.data;
              this.setAccessToken(access);

              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${access}`;
              }

              return this.api(originalRequest);
            } catch (refreshError) {
              this.logout();
              window.location.href = '/login';
            }
          } else {
            this.logout();
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Token management
  private setAccessToken(token: string): void {
    localStorage.setItem('access_token', token);
  }

  private getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private setRefreshToken(token: string): void {
    localStorage.setItem('refresh_token', token);
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  // Auth endpoints
  async register(data: RegisterRequest): Promise<ApiResponse<{ user: UserResponse; tokens: TokensResponse }>> {
    const response = await this.api.post('/auth/register/', data);
    const { tokens } = response.data;
    this.setAccessToken(tokens.access);
    this.setRefreshToken(tokens.refresh);
    return response;
  }

  async login(data: LoginRequest): Promise<ApiResponse<{ user: UserResponse; tokens: TokensResponse }>> {
    const response = await this.api.post('/auth/login/', data);
    const { tokens } = response.data;
    this.setAccessToken(tokens.access);
    this.setRefreshToken(tokens.refresh);
    return response;
  }

  async logout(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    try {
      if (refreshToken) {
        await this.api.post('/auth/logout/', { refresh: refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  async getProfile(): Promise<ApiResponse<UserResponse>> {
    return this.api.get('/auth/profile/');
  }

  // Course endpoints
  async getModules(): Promise<ApiResponse<any[]>> {
    return this.api.get('/courses/modules/');
  }

  async getModuleDetail(id: number): Promise<ApiResponse<any>> {
    return this.api.get(`/courses/modules/${id}/`);
  }

  async getTaskList(filters?: Record<string, any>): Promise<ApiResponse<any>> {
    return this.api.get('/courses/tasks/', { params: filters });
  }

  async getTaskDetail(id: number): Promise<ApiResponse<any>> {
    return this.api.get(`/courses/tasks/${id}/`);
  }

  async submitTask(taskId: number, answer: any, usingHint: boolean = false): Promise<ApiResponse<any>> {
    return this.api.post(`/courses/tasks/${taskId}/submit/`, {
      task: taskId,
      submitted_answer: answer,
      is_using_hint: usingHint,
    });
  }

  async getProgress(): Promise<ApiResponse<any>> {
    return this.api.get('/courses/progress/');
  }

  async getResults(): Promise<ApiResponse<any>> {
    return this.api.get('/courses/results/');
  }

  // Analytics endpoints
  async getMyStatistics(): Promise<ApiResponse<any>> {
    return this.api.get('/analytics/my-statistics/');
  }

  async getTaskStatistics(): Promise<ApiResponse<any>> {
    return this.api.get('/analytics/task-statistics/');
  }

  async getModuleStatistics(): Promise<ApiResponse<any>> {
    return this.api.get('/analytics/module-statistics/');
  }

  async getLearningPath(): Promise<ApiResponse<any>> {
    return this.api.get('/analytics/learning-path/');
  }

  // Gamification endpoints
  async getAchievements(): Promise<ApiResponse<any>> {
    return this.api.get('/gamification/achievements/');
  }

  async getMyAchievements(): Promise<ApiResponse<any>> {
    return this.api.get('/gamification/my-achievements/');
  }

  async getRanking(): Promise<ApiResponse<any>> {
    return this.api.get('/gamification/ranking/');
  }

  async getMyRanking(): Promise<ApiResponse<any>> {
    return this.api.get('/gamification/my-ranking/');
  }

  async getBonusPoints(): Promise<ApiResponse<any>> {
    return this.api.get('/gamification/bonus-points/');
  }

  // Generic get/post/put/delete methods
  async get<T = any>(endpoint: string, config?: any): Promise<ApiResponse<T>> {
    return this.api.get(endpoint, config);
  }

  async post<T = any>(endpoint: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    return this.api.post(endpoint, data, config);
  }

  async put<T = any>(endpoint: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    return this.api.put(endpoint, data, config);
  }

  async delete<T = any>(endpoint: string, config?: any): Promise<ApiResponse<T>> {
    return this.api.delete(endpoint, config);
  }
}

export const apiService = new ApiService();
export default apiService;
