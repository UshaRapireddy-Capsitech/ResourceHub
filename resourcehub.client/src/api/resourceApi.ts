import api from "./api";
import type { ApiResponse } from "../types/api";
import type {
  ResourceDto,
  CreateResourceDto,
  UpdateResourceDto,
  ReviewDto,
  ShareDto,
} from "../types/resource";

export const getMyResources = async () => {
  const response = await api.get<ApiResponse<ResourceDto[]>>("/Resources");
  return response.data;
};

export const getSharedResources = async () => {
  const response = await api.get<ApiResponse<ResourceDto[]>>("/Resources/shared");
  return response.data;
};

export const getPendingResources = async () => {
  const response = await api.get<ApiResponse<ResourceDto[]>>("/Resources/pending");
  return response.data;
};

export const getResourceById = async (id: string) => {
  const response = await api.get<ApiResponse<ResourceDto>>(`/Resources/${id}`);
  return response.data;
};

export const createResource = async (formData: CreateResourceDto) => {
  const data = new FormData();
  data.append("title", formData.title);
  data.append("content", formData.content);
  data.append("scope", formData.scope);
  data.append("sendForReview", String(formData.sendForReview));
  if (formData.sharedWithUserIds && formData.sharedWithUserIds.length > 0) {
    formData.sharedWithUserIds.forEach((uid) => data.append("sharedWithUserIds", uid));
  }
  if (formData.attachment) data.append("attachment", formData.attachment);

  const response = await api.post<ApiResponse<ResourceDto>>("/Resources", data);
  return response.data;
};

export const updateResource = async (id: string, formData: UpdateResourceDto) => {
  const data = new FormData();
  data.append("title", formData.title);
  data.append("content", formData.content);
  data.append("scope", formData.scope);
  data.append("sendForReview", String(formData.sendForReview));
  data.append("removeExistingAttachment", String(formData.removeExistingAttachment || false));
  if (formData.sharedWithUserIds && formData.sharedWithUserIds.length > 0) {
    formData.sharedWithUserIds.forEach((uid) => data.append("sharedWithUserIds", uid));
  }
  if (formData.attachment) data.append("attachment", formData.attachment);

  const response = await api.put<ApiResponse<ResourceDto>>(`/Resources/${id}`, data);
  return response.data;
};

export const deleteResource = async (id: string) => {
  const response = await api.delete<ApiResponse<boolean>>(`/Resources/${id}`);
  return response.data;
};

export const reviewResource = async (id: string, reviewData: ReviewDto) => {
  const response = await api.put<ApiResponse<boolean>>(`/Resources/${id}/review`, reviewData);
  return response.data;
};

export const shareResource = async (id: string, shareData: ShareDto) => {
  const response = await api.put<ApiResponse<boolean>>(`/Resources/${id}/share`, shareData);
  return response.data;
};

export const getDownloadUrl = (id: string) => `${api.defaults.baseURL || "https://localhost:7151/api"}/Resources/${id}/download`;

export const downloadAttachment = async (id: string, fileName?: string) => {
  try {
    const response = await api.get(`/Resources/${id}/download`, {
      responseType: "blob",
    });
    const contentType = (response.headers["content-type"] as string | undefined) || "application/octet-stream";
    const blob = new Blob([response.data], { type: contentType });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName || "attachment";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (err: any) {
    let errorMsg = "Unable to download attachment.";
    if (err.response?.data instanceof Blob) {
      try {
        const text = await err.response.data.text();
        const json = JSON.parse(text);
        errorMsg = json.message || errorMsg;
      } catch {
        errorMsg = "Resource attachment not found or access denied.";
      }
    } else if (err.response?.data?.message) {
      errorMsg = err.response.data.message;
    }
    throw new Error(errorMsg);
  }
};