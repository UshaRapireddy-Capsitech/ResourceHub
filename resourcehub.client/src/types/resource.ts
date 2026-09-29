export type ResourceScope = "OnlyMe" | "Custom" | "OrgWide";

export type ResourceStatus = "Draft" | "Pending" | "Approved" | "Rejected";

export interface ResourceDto {
  id: string;
  refNo: string;
  title: string;
  content: string;
  scope: ResourceScope;
  status: ResourceStatus;
  sharedWithUserIds: string[];
  reviewNote?: string;
  attachmentOriginalName?: string;
  attachmentFileSize?: number;
  hasAttachment: boolean;
  authorId: string;
  authorName: string;
  updatedById?: string;
  updatedByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResourceDto {
  title: string;
  content: string;
  scope: ResourceScope;
  sharedWithUserIds?: string[];
  sendForReview: boolean;
  attachment?: File;
}

export interface UpdateResourceDto {
  title: string;
  content: string;
  scope: ResourceScope;
  sharedWithUserIds?: string[];
  sendForReview: boolean;
  attachment?: File;
  removeExistingAttachment?: boolean;
}

export interface ReviewDto {
  status: ResourceStatus;
  reviewNote?: string;
}

export interface ShareDto {
  scope: ResourceScope;
  userIds: string[];
}