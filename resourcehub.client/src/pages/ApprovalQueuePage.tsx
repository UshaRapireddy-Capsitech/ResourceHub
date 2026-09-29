import React, { useEffect, useState } from "react";
import { Stack, Text, DetailsList, DetailsListLayoutMode, SelectionMode, type IColumn, PrimaryButton, MessageBar, MessageBarType, Spinner, SpinnerSize, Persona, PersonaSize, Icon, getTheme, mergeStyleSets } from "@fluentui/react";
import type { ResourceDto } from "../types/resource";
import { getPendingResources } from "../api/resourceApi";

interface ApprovalQueuePageProps {
  onViewResource: (resource: ResourceDto) => void;
  onOpenReviewDialog: (resource: ResourceDto) => void;
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
  scopeBadge: {
    fontSize: 12,
    color: palette.themePrimary,
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: palette.neutralSecondary,
  },
  centerPadding: {
    padding: 48,
  },
  emptySubtitle: {
    color: palette.neutralSecondary,
  },
  authorPersona: {
    cursor: "default",
  },
});

export const ApprovalQueuePage: React.FC<ApprovalQueuePageProps> = ({
  onViewResource,
  onOpenReviewDialog,
}) => {
  const [resources, setResources] = useState<ResourceDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<{ text: string; type: MessageBarType } | null>(null);

  const fetchPendingResources = async () => {
    setLoading(true);
    try {
      const response = await getPendingResources();
      setResources(response.data || []);
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.message || "Failed to load pending approval submissions.",
        type: MessageBarType.error,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingResources();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

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
      maxWidth: 360,
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
      name: "Submitted By",
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
      name: "Target Scope",
      fieldName: "scope",
      minWidth: 130,
      maxWidth: 160,
      isResizable: true,
      onRender: (item: ResourceDto) => (
        <span className={styles.scopeBadge}>
          <Icon iconName={item.scope === "OrgWide" ? "Globe" : "Lock"} />
          {item.scope === "OrgWide" ? "Organisation-Wide" : "Only Me"}
        </span>
      ),
    },
    {
      key: "createdAt",
      name: "Submitted On",
      fieldName: "createdAt",
      minWidth: 130,
      maxWidth: 160,
      isResizable: true,
      onRender: (item: ResourceDto) => (
        <Text className={styles.dateText}>
          {new Date(item.createdAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </Text>
      ),
    },
    {
      key: "actions",
      name: "Action",
      fieldName: "actions",
      minWidth: 100,
      maxWidth: 120,
      onRender: (item: ResourceDto) => (
        <PrimaryButton
          text="Review"
          iconProps={{ iconName: "CheckList" }}
          onClick={() => onOpenReviewDialog(item)}
        />
      ),
    },
  ];

  return (
    <Stack tokens={{ childrenGap: 20 }} className={styles.container}>
      <Text variant="xxLarge">
        Approval Queue
      </Text>

      {message && (
        <MessageBar messageBarType={message.type} onDismiss={() => setMessage(null)}>
          {message.text}
        </MessageBar>
      )}

      <div className={styles.listCard}>
        {loading ? (
          <Stack horizontalAlign="center" tokens={{ childrenGap: 12 }} className={styles.centerPadding}>
            <Spinner size={SpinnerSize.large} label="Loading approval queue..." />
          </Stack>
        ) : resources.length === 0 ? (
          <Stack horizontalAlign="center" tokens={{ childrenGap: 12 }} className={styles.centerPadding}>
            <Icon iconName="CompletedSolid" styles={{ root: { fontSize: 32, color: palette.green } }} />
            <Text variant="large">
              All caught up!
            </Text>
            <Text className={styles.emptySubtitle}>
              There are currently resources pending administrative review.
            </Text>
          </Stack>
        ) : (
          <DetailsList
            items={resources}
            columns={columns}
            setKey="approval-queue-list"
            layoutMode={DetailsListLayoutMode.justified}
            selectionMode={SelectionMode.none}
            isHeaderVisible={true}
          />
        )}
      </div>
    </Stack>
  );
};

export default ApprovalQueuePage;
