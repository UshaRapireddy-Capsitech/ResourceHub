import React, { useEffect, useState } from "react";
import { Stack, Text, DetailsList, DetailsListLayoutMode, SelectionMode, type IColumn, IconButton, TooltipHost, MessageBar, MessageBarType, Spinner, SpinnerSize, Persona, PersonaSize, Icon, getTheme, mergeStyleSets } from "@fluentui/react";
import type { ResourceDto } from "../types/resource";
import { getSharedResources, downloadAttachment } from "../api/resourceApi";
import { useAppSelector } from "../store/hooks";

interface SharedResourcesPageProps {
  onViewResource: (resource: ResourceDto) => void;
  onShareResource: (resource: ResourceDto) => void;
}

const theme = getTheme();
const { palette } = theme;

const styles = mergeStyleSets({
  container: {
    padding: 24,
    width: "100%",
    boxSizing: "border-box",
  },
  listCard: {
    backgroundColor: palette.white,
    borderRadius: 4,
    border: `1px solid ${palette.neutralLight}`,
    overflow: "hidden",
  },
  refLink: {
    color: palette.themePrimary,
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "underline",
  },
  titleText: {
    fontWeight: 600,
    color: palette.neutralPrimary,
    cursor: "pointer",
  },
  authorPersona: {
    cursor: "default",
  },
  scopeOrg: {
    fontSize: 12,
    color: palette.themePrimary,
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  },
  scopeSharedWithYou: {
    fontSize: 12,
    color: palette.themeDark,
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: palette.neutralSecondary,
  },
  noAttachmentText: {
    color: palette.neutralTertiary,
    fontSize: 12,
  },
  noActionText: {
    color: palette.neutralTertiary,
    fontSize: 12,
  },
  centerPadding: {
    padding: 48,
  },
  emptySubtitle: {
    color: palette.neutralSecondary,
  },
});

export const SharedResourcesPage: React.FC<SharedResourcesPageProps> = ({
  onViewResource,
  onShareResource,
}) => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const [resources, setResources] = useState<ResourceDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<{ text: string; type: MessageBarType } | null>(null);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const response = await getSharedResources();
      setResources(response.data || []);
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.message || "Failed to load shared resources.",
        type: MessageBarType.error,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleDownload = async (id: string, fileName?: string) => {
    try {
      await downloadAttachment(id, fileName);
    } catch (err: any) {
      setMessage({
        text: err.message || "Failed to download attachment.",
        type: MessageBarType.error,
      });
    }
  };

  const columns: IColumn[] = [
    {
      key: "refNo",
      name: "Ref No",
      fieldName: "refNo",
      minWidth: 85,
      maxWidth: 100,
      isResizable: true,
      onRender: (item: ResourceDto) => (
        <span
          onClick={() => onViewResource(item)}
          className={styles.refLink}
        >
          {item.refNo}
        </span>
      ),
    },
    {
      key: "title",
      name: "Title",
      fieldName: "title",
      minWidth: 220,
      maxWidth: 380,
      isResizable: true,
      onRender: (item: ResourceDto) => (
        <Text
          onClick={() => onViewResource(item)}
          className={styles.titleText}
        >
          {item.title}
        </Text>
      ),
    },
    {
      key: "authorName",
      name: "Author",
      fieldName: "authorName",
      minWidth: 150,
      maxWidth: 200,
      isResizable: true,
      onRender: (item: ResourceDto) => (
        <Persona
          text={item.authorName || "Unknown Author"}
          size={PersonaSize.size24}
          className={styles.authorPersona}
        />
      ),
    },
    {
      key: "scope",
      name: "Access Scope",
      fieldName: "scope",
      minWidth: 140,
      maxWidth: 170,
      isResizable: true,
      onRender: (item: ResourceDto) => (
        <span className={item.scope === "OrgWide" ? styles.scopeOrg : styles.scopeSharedWithYou}>
          <Icon iconName={item.scope === "OrgWide" ? "Globe" : "People"} />
          {item.scope === "OrgWide" ? "Organisation-Wide" : "Shared with You"}
        </span>
      ),
    },
    {
      key: "updatedAt",
      name: "Last Updated",
      fieldName: "updatedAt",
      minWidth: 130,
      maxWidth: 160,
      isResizable: true,
      onRender: (item: ResourceDto) => (
        <Text className={styles.dateText}>
          {new Date(item.updatedAt || item.createdAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </Text>
      ),
    },
    {
      key: "attachment",
      name: "Attachment",
      fieldName: "attachment",
      minWidth: 80,
      maxWidth: 100,
      onRender: (item: ResourceDto) => (
        <TooltipHost content={item.hasAttachment ? `Download: ${item.attachmentOriginalName || "Attachment"}` : "No attachment available"}>
          <IconButton
            iconProps={{ iconName: "Download" }}
            ariaLabel={item.hasAttachment ? "Download Attachment" : "No attachment"}
            disabled={!item.hasAttachment}
            onClick={item.hasAttachment ? () => handleDownload(item.id, item.attachmentOriginalName) : undefined}
          />
        </TooltipHost>
      ),
    },
    {
      key: "actions",
      name: "Actions",
      minWidth: 80,
      maxWidth: 100,
      onRender: (item: ResourceDto) => {
        const canShare = currentUser?.role === "Admin" || currentUser?.id === item.authorId;
        return (
          <TooltipHost content={canShare ? "Share Resource" : "Only the author or an admin can change share settings"}>
            <IconButton
              iconProps={{ iconName: "Share" }}
              ariaLabel="Share Resource"
              disabled={!canShare}
              onClick={canShare ? () => onShareResource(item) : undefined}
            />
          </TooltipHost>
        );
      },
    },
  ];

  return (
    <Stack tokens={{ childrenGap: 20 }} className={styles.container}>
      <Text variant="xxLarge">
        Shared Resources
      </Text>

      {message && (
        <MessageBar messageBarType={message.type} onDismiss={() => setMessage(null)}>
          {message.text}
        </MessageBar>
      )}

      <div className={styles.listCard}>
        {loading ? (
          <Stack horizontalAlign="center" tokens={{ childrenGap: 12 }} className={styles.centerPadding}>
            <Spinner size={SpinnerSize.large} label="Loading knowledge base..." />
          </Stack>
        ) : resources.length === 0 ? (
          <Stack horizontalAlign="center" tokens={{ childrenGap: 12 }} className={styles.centerPadding}>
            <Icon iconName="DocumentSearch" styles={{ root: { fontSize: 32, color: palette.neutralSecondary } }} />
            <Text variant="large">
              No resources found
            </Text>
            <Text className={styles.emptySubtitle}>
              No organization-wide resources or guides have been published yet.
            </Text>
          </Stack>
        ) : (
          <DetailsList
            items={resources}
            columns={columns}
            setKey="shared-resources-list"
            layoutMode={DetailsListLayoutMode.justified}
            selectionMode={SelectionMode.none}
            isHeaderVisible={true}
          />
        )}
      </div>
    </Stack>
  );
};

export default SharedResourcesPage;
