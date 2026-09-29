import React, { useEffect, useState } from "react";
import { Stack, Text, PrimaryButton, DetailsList, DetailsListLayoutMode, SelectionMode, type IColumn, type IContextualMenuProps, IconButton, TooltipHost, MessageBar, MessageBarType, Spinner, SpinnerSize, Dialog, DialogType, DialogFooter, DefaultButton, Icon, getTheme, mergeStyleSets } from "@fluentui/react";
import type { ResourceDto, ResourceStatus } from "../types/resource";
import { getMyResources, deleteResource, downloadAttachment } from "../api/resourceApi";

interface MyResourcesPageProps {
  onAddResource: () => void;
  onEditResource: (resource: ResourceDto) => void;
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
  scopeOrg: {
    fontSize: 12,
    color: palette.themePrimary,
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  },
  scopeCustom: {
    fontSize: 12,
    color: palette.themeSecondary,
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  },
  scopeMe: {
    fontSize: 12,
    color: palette.neutralSecondary,
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
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
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
  centerPadding: {
    padding: 48,
  },
  emptySubtitle: {
    color: palette.neutralSecondary,
  },
  deleteMenuItem: {
    color: palette.redDark,
  },
  hiddenMenuIcon: {
    display: "none !important",
    width: 0,
    margin: 0,
    padding: 0,
  },
});

export const MyResourcesPage: React.FC<MyResourcesPageProps> = ({
  onAddResource,
  onEditResource,
  onViewResource,
  onShareResource,
}) => {
  const [resources, setResources] = useState<ResourceDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<{ text: string; type: MessageBarType } | null>(null);

  const [resourceToDelete, setResourceToDelete] = useState<ResourceDto | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const response = await getMyResources();
      setResources(response.data || []);
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.message || "Failed to load your resources.",
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

  const handleDeleteConfirm = async () => {
    if (!resourceToDelete) return;
    setIsDeleting(true);
    try {
      const response = await deleteResource(resourceToDelete.id);
      setMessage({
        text: response.message || "Resource deleted successfully.",
        type: MessageBarType.success,
      });
      setResourceToDelete(null);
      fetchResources();
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.message || "Failed to delete resource.",
        type: MessageBarType.error,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: ResourceStatus, reviewNote?: string) => {
    let statusClass = styles.statusDraft;
    let iconName = "Edit";
    let label: string = status;

    switch (status) {
      case "Approved":
        statusClass = styles.statusApproved;
        iconName = "CompletedSolid";
        break;
      case "Pending":
        statusClass = styles.statusPending;
        iconName = "Clock";
        label = "Pending Review";
        break;
      case "Rejected":
        statusClass = styles.statusRejected;
        iconName = "StatusCircleErrorX";
        break;
      case "Draft":
        statusClass = styles.statusDraft;
        iconName = "Edit";
        break;
    }

    const badgeElement = (
      <span className={`${styles.statusBadge} ${statusClass}`}>
        <Icon iconName={iconName} />
        {label}
      </span>
    );

    if (status === "Rejected" && reviewNote) {
      return (
        <TooltipHost content={`Rejection note: ${reviewNote}`}>
          {badgeElement}
        </TooltipHost>
      );
    }

    return badgeElement;
  };

  const columns: IColumn[] = [
    {
      key: "refNo",
      name: "Ref No",
      fieldName: "refNo",
      minWidth: 100,
      maxWidth: 150,
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
      minWidth: 250,
      maxWidth: 300,
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
      key: "scope",
      name: "Scope",
      fieldName: "scope",
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      onRender: (item: ResourceDto) => {
        if (item.scope === "OrgWide") {
          return (
            <span className={styles.scopeOrg}>
              <Icon iconName="Globe" />
              Organisation-Wide
            </span>
          );
        }
        if (item.scope === "Custom") {
          return (
            <span className={styles.scopeCustom}>
              <Icon iconName="People" />
              Shared ({item.sharedWithUserIds?.length || 0})
            </span>
          );
        }
        return (
          <span className={styles.scopeMe}>
            <Icon iconName="Lock" />
            Private
          </span>
        );
      },
    },
    {
      key: "status",
      name: "Status",
      fieldName: "status",
      minWidth: 130,
      maxWidth: 150,
      isResizable: true,
      onRender: (item: ResourceDto) => getStatusBadge(item.status, item.reviewNote),
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
      minWidth: 90,
      maxWidth: 110,
      onRender: (item: ResourceDto) => {
        const menuProps: IContextualMenuProps = {
          items: [
            {
              key: "edit",
              text: "Edit",
              iconProps: { iconName: "Edit" },
              onClick: () => onEditResource(item),
            },
            {
              key: "delete",
              text: "Delete",
              iconProps: {
                iconName: "Delete",
                styles: { root: { color: palette.redDark } },
              },
              onClick: () => setResourceToDelete(item),
              className: styles.deleteMenuItem,
            },
          ],
        };

        return (
          <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 2 }}>
            {item.status === "Approved" ? (
              <TooltipHost content="Share Resource">
                <IconButton
                  iconProps={{ iconName: "Share" }}
                  ariaLabel="Share Resource"
                  onClick={() => onShareResource(item)}
                />
              </TooltipHost>
            ) : (
              <IconButton
                iconProps={{ iconName: "Share" }}
                disabled={true}
                ariaLabel="Share Resource"
              />
            )}

            <TooltipHost content="More Actions">
              <IconButton
                iconProps={{ iconName: "More" }}
                menuIconProps={{ hidden: true, style: { display: "none" } }}
                styles={{
                  menuIcon: styles.hiddenMenuIcon,
                  splitButtonMenuButton: styles.hiddenMenuIcon,
                }}
                ariaLabel="More Actions"
                menuProps={menuProps}
              />
            </TooltipHost>
          </Stack>
        );
      },
    },
  ];

  return (
    <Stack tokens={{ childrenGap: 20 }} className={styles.container}>
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center" wrap>
        <Text variant="xxLarge">
          My Resources
        </Text>
        <PrimaryButton
          iconProps={{ iconName: "Add" }}
          text="New Resource"
          onClick={onAddResource}
        />
      </Stack>

      {message && (
        <MessageBar messageBarType={message.type} onDismiss={() => setMessage(null)}>
          {message.text}
        </MessageBar>
      )}

      <div className={styles.listCard}>
        {loading ? (
          <Stack horizontalAlign="center" tokens={{ childrenGap: 12 }} className={styles.centerPadding}>
            <Spinner size={SpinnerSize.large} label="Loading your resources..." />
          </Stack>
        ) : resources.length === 0 ? (
          <Stack horizontalAlign="center" tokens={{ childrenGap: 12 }} className={styles.centerPadding}>
            <Text variant="large">
              No resources found
            </Text>
            <Text className={styles.emptySubtitle}>
              Get started by creating your first resource or SOP guide.
            </Text>
            <PrimaryButton
              iconProps={{ iconName: "Add" }}
              text="Create Resource"
              onClick={onAddResource}
            />
          </Stack>
        ) : (
          <DetailsList
            items={resources}
            columns={columns}
            setKey="my-resources-list"
            layoutMode={DetailsListLayoutMode.justified}
            selectionMode={SelectionMode.none}
            isHeaderVisible={true}
          />
        )}
      </div>

      <Dialog
        hidden={!resourceToDelete}
        onDismiss={() => setResourceToDelete(null)}
        dialogContentProps={{
          type: DialogType.normal,
          title: "Delete Resource",
          subText: `Are you sure you want to delete "${resourceToDelete?.title}" (${resourceToDelete?.refNo})? This action cannot be undone.`,
        }}
        modalProps={{ isBlocking: true }}
      >
        <DialogFooter>
          <PrimaryButton
            onClick={handleDeleteConfirm}
            text="Delete"
            disabled={isDeleting}
          />
          <DefaultButton onClick={() => setResourceToDelete(null)} text="Cancel" disabled={isDeleting} />
        </DialogFooter>
      </Dialog>
    </Stack>
  );
};

export default MyResourcesPage;
