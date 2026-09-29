import React, { useState } from "react";
import { Modal, Stack, Text, PrimaryButton, DefaultButton, IconButton, MessageBar, MessageBarType, Icon, getTheme, mergeStyleSets } from "@fluentui/react";
import type { ResourceDto } from "../types/resource";
import { downloadAttachment } from "../api/resourceApi";
import { useAppSelector } from "../store/hooks";

interface ResourceDetailsModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  resource: ResourceDto | null;
  onOpenShareDialog?: (resource: ResourceDto) => void;
}

const theme = getTheme();
const { palette } = theme;

const styles = mergeStyleSets({
  modalMain: {
    width: "90vw",
    maxWidth: 1100,
    height: "85vh",
    borderRadius: 6,
    display: "flex",
    flexDirection: "column",
    backgroundColor: palette.white,
    overflow: "hidden",
  },
  headerBar: {
    padding: "16px 24px",
    borderBottom: `1px solid ${palette.neutralLight}`,
    backgroundColor: palette.neutralLighterAlt,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
  },
  refBadge: {
    color: palette.neutralSecondary,
    fontWeight: 600,
    fontSize: 13,
  },
  modalTitle: {
    fontWeight: 600,
    color: palette.neutralPrimary,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  metadataStrip: {
    padding: "12px 24px",
    backgroundColor: palette.white,
    borderBottom: `1px solid ${palette.neutralLight}`,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  },
  statusApproved: {
    color: palette.green,
  },
  statusPending: {
    color: palette.yellowDark,
  },
  statusRejected: {
    color: palette.redDark,
  },
  statusDraft: {
    color: palette.neutralSecondary,
  },
  scopeBadge: {
    fontSize: 12,
    fontWeight: 600,
    color: palette.themePrimary,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  },
  attachmentBadge: {
    fontSize: 12,
    fontWeight: 600,
    color: palette.themeDark,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  },
  metaLabel: {
    color: palette.neutralSecondary,
  },
  metaValue: {
    color: palette.neutralPrimary,
  },
  reviewNoteWrapper: {
    padding: "10px 24px 0 24px",
  },
  readingCanvas: {
    flex: 1,
    overflowY: "auto",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  contentView: {
    padding: "24px",
    backgroundColor: palette.white,
    border: `1px solid ${palette.neutralLight}`,
    borderRadius: 4,
    minHeight: 300,
    lineHeight: 1.7,
    fontSize: 14,
    color: palette.neutralPrimary,
  },
  attachmentCard: {
    padding: "14px 18px",
    backgroundColor: palette.neutralLighterAlt,
    borderRadius: 4,
    border: `1px solid ${palette.neutralLight}`,
  },
  attachmentFileName: {
    fontWeight: 600,
    fontSize: 14,
  },
});

export const ResourceDetailsModal: React.FC<ResourceDetailsModalProps> = ({
  isOpen,
  onDismiss,
  resource,
  onOpenShareDialog,
}) => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  if (!resource) return null;

  const isAuthorOrAdmin = currentUser?.id === resource.authorId || currentUser?.role === "Admin";
  const canShare = isAuthorOrAdmin && resource.status === "Approved";

  const handleDownload = async () => {
    setDownloadError(null);
    try {
      await downloadAttachment(resource.id, resource.attachmentOriginalName);
    } catch (err: any) {
      setDownloadError(err.message || "Failed to download attachment.");
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Approved":
        return styles.statusApproved;
      case "Pending":
        return styles.statusPending;
      case "Rejected":
        return styles.statusRejected;
      default:
        return styles.statusDraft;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Approved":
        return "CompletedSolid";
      case "Pending":
        return "Clock";
      case "Rejected":
        return "StatusCircleErrorX";
      default:
        return "Edit";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={onDismiss}
      isBlocking={false}
      styles={{
        main: styles.modalMain,
      }}
    >
      <Stack
        horizontal
        horizontalAlign="space-between"
        verticalAlign="center"
        className={styles.headerBar}
      >
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 12 }} className={styles.headerLeft}>
          <span className={styles.refBadge}>
            {resource.refNo}
          </span>
          <Text variant="xLarge" className={styles.modalTitle}>
            {resource.title}
          </Text>
        </Stack>

        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
          {canShare && onOpenShareDialog && (
            <DefaultButton
              iconProps={{ iconName: "Share" }}
              text="Share"
              onClick={() => {
                onDismiss();
                onOpenShareDialog(resource);
              }}
            />
          )}
          <IconButton
            iconProps={{ iconName: "Cancel" }}
            title="Close"
            ariaLabel="Close"
            onClick={onDismiss}
          />
        </Stack>
      </Stack>

      <Stack
        horizontal
        horizontalAlign="space-between"
        verticalAlign="center"
        className={styles.metadataStrip}
      >
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 16 }}>
          <span className={`${styles.statusBadge} ${getStatusClass(resource.status)}`}>
            <Icon iconName={getStatusIcon(resource.status)} />
            {resource.status}
          </span>

          {resource.scope === "OrgWide" ? (
            <span className={styles.scopeBadge}>
              <Icon iconName="Globe" />
              Organisation-Wide
            </span>
          ) : resource.scope === "Custom" ? (
            <span className={styles.scopeBadge}>
              <Icon iconName="People" />
              Specific People ({resource.sharedWithUserIds?.length || 0})
            </span>
          ) : (
            <span className={styles.scopeBadge}>
              <Icon iconName="Lock" />
              Private (Only Me)
            </span>
          )}

          {resource.hasAttachment && (
            <span className={styles.attachmentBadge}>
              <Icon iconName="Attach" />
              Attached File
            </span>
          )}
        </Stack>

        <Stack tokens={{ childrenGap: 2 }} horizontalAlign="end">
          <Text variant="small" className={styles.metaLabel}>
            Author: <strong className={styles.metaValue}>{resource.authorName}</strong>
          </Text>
          <Text variant="small" className={styles.metaLabel}>
            Created: <strong className={styles.metaValue}>{new Date(resource.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</strong>
          </Text>
          {resource.updatedByName && (
            <Text variant="small" className={styles.metaLabel}>
              Updated by: <strong className={styles.metaValue}>{resource.updatedByName}</strong> ({new Date(resource.updatedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })})
            </Text>
          )}
        </Stack>
      </Stack>

      {resource.reviewNote && (
        <div className={styles.reviewNoteWrapper}>
          <MessageBar messageBarType={MessageBarType.warning}>
            <strong>Reviewer Note:</strong> {resource.reviewNote}
          </MessageBar>
        </div>
      )}

      <div className={styles.readingCanvas}>
        <div
          className={`ck-content rich-content-view ${styles.contentView}`}
          dangerouslySetInnerHTML={{ __html: resource.content }}
        />

        {resource.hasAttachment && resource.attachmentOriginalName && (
          <Stack
            horizontal
            verticalAlign="center"
            horizontalAlign="space-between"
            className={styles.attachmentCard}
          >
            <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 12 }}>
              <Icon iconName="Attach" styles={{ root: { fontSize: 20, color: palette.themePrimary } }} />
              <Stack tokens={{ childrenGap: 2 }}>
                <Text className={styles.attachmentFileName}>
                  {resource.attachmentOriginalName}
                </Text>
                <Text variant="small" className={styles.metaLabel}>
                  {resource.attachmentFileSize ? `${Math.round(resource.attachmentFileSize / 1024)} KB` : "Attached file"}
                </Text>
              </Stack>
            </Stack>

            <PrimaryButton
              iconProps={{ iconName: "Download" }}
              text="Download"
              onClick={handleDownload}
            />
          </Stack>
        )}

        {downloadError && (
          <MessageBar
            messageBarType={MessageBarType.error}
            isMultiline={false}
            onDismiss={() => setDownloadError(null)}
          >
            {downloadError}
          </MessageBar>
        )}
      </div>
    </Modal>
  );
};

export default ResourceDetailsModal;
