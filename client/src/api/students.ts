import { Student } from "@/types/students";
import { storage } from "@/utils/storage";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  errors?: string | Record<string, string[]>;
}

class StudentsApi {
  getAuthHeaders(): Record<string, string> {
    console.log("getAuthHeaders called, this:", this);
    const token = storage.get("token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  private getMultipartHeaders(): Record<string, string> {
    const token = storage.get("token");
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  async create(studentData: Omit<Student, "id">): Promise<Student> {
    console.log("create method called, this:", this);
    console.log("studentData:", studentData);

    try {
      const headers = this.getAuthHeaders();
      console.log("headers:", headers);

      const response = await fetch(`${API_BASE_URL}guest/users`, {
        method: "POST",
        headers,
        body: JSON.stringify(studentData),
      });

      if (!response.ok) {
        const errorData: ApiResponse<never> = await response
          .json()
          .catch(() => ({
            status: response.status,
            message: "Unknown error",
            data: null,
          }));
        throw new Error(errorData.message || "Failed to create student");
      }

      const result: ApiResponse<Student> = await response.json();
      return result.data;
    } catch (error) {
      console.error("Error in create method:", error);
      throw error;
    }
  }

  async getAll(): Promise<Student[]> {
    const response = await fetch(`${API_BASE_URL}/v1/students`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch students");
    }

    const result: ApiResponse<Student[]> = await response.json();
    return result.data;
  }

  async getById(id: string | number): Promise<Student> {
    const response = await fetch(`${API_BASE_URL}/v1/students/${id}`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch student");
    }

    const result: ApiResponse<Student> = await response.json();
    return result.data;
  }

  async update(
    id: string | number,
    studentData: Partial<Student>,
  ): Promise<Student> {
    const response = await fetch(`${API_BASE_URL}/v1/students/${id}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(studentData),
    });

    if (!response.ok) {
      const errorData: ApiResponse<never> = await response.json().catch(() => ({
        status: response.status,
        message: "Unknown error",
        data: null,
      }));
      throw new Error(errorData.message || "Failed to update student");
    }

    const result: ApiResponse<Student> = await response.json();
    return result.data;
  }

  async delete(id: string | number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/v1/students/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to delete student");
    }
  }

  async createWithQrCode(userData: {
    name: string;
    email: string;
    class: string;
  }): Promise<{
    user_id: number;
    name: string;
    email: string;
    class: string;
    qrcode_url: string;
    email_sent: boolean;
    email_message: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/v1/guest/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData: ApiResponse<never> = await response.json().catch(() => ({
        status: response.status,
        message: "Unknown error",
        data: null,
      }));
      throw new Error(errorData.message || "Failed to create user");
    }

    const result: ApiResponse<never> = await response.json();
    return result.data;
  }

  async updateProfile(profileData: { email: string; avatar: File }): Promise<{
    avatar_path: string;
    avatar_url: string;
  }> {
    const formData = new FormData();
    formData.append("email", profileData.email);
    formData.append("avatar", profileData.avatar);

    const response = await fetch(`${API_BASE_URL}/v1/auth/profile/update`, {
      method: "POST",
      headers: this.getMultipartHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const errorData: ApiResponse<never> = await response.json().catch(() => ({
        status: response.status,
        message: "Unknown error",
        data: null,
      }));
      throw new Error(errorData.message || "Failed to update profile");
    }

    const result: ApiResponse<never> = await response.json();
    return result.data;
  }

  async sendQrCodeEmail(emailData: {
    to: string;
    name: string;
    attachmentUrl: string;
    class: string;
  }): Promise<{
    recipient: string;
    qrcode_url: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/v1/auth/email/send`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorData: ApiResponse<never> = await response.json().catch(() => ({
        status: response.status,
        message: "Unknown error",
        data: null,
      }));
      throw new Error(errorData.message || "Failed to send email");
    }

    const result: ApiResponse<never> = await response.json();
    return result.data;
  }
}

export const studentsApi = new StudentsApi();

