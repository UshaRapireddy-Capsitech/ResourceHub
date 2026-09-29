import React, { useEffect, useState } from "react";
import { Panel, PanelType, Stack, Text, TextField, PrimaryButton, Dropdown, type IDropdownOption, MessageBar, MessageBarType, IconButton, FontWeights, Icon, getTheme, mergeStyleSets } from "@fluentui/react";
import { shareResource } from "../api/resourceApi";
import { getUsers } from "../api/userApi";
import type { ResourceDto, ResourceScope } from "../types/resource";
import type { UserDto } from "../types/user";

interface ShareDialogProps {
  isOpen: boolean;
  onDismiss: () => void;
  resource: ResourceDto | null;
  onSuccess: () => void;
}

const theme = getTheme();
const { palette } = theme;

const styles = mergeStyleSets({
  formRoot: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    height: "100%",
    marginTop: 8,
  },
  sectionTitle: {
    fontWeight: FontWeights.semibold,
    fontSize: 14,
  },
  urlField: {
    flex: 1,
  },
  peopleListScrollable: {
    maxHeight: 200,
    overflowY: "auto",
    border: `1px solid ${palette.neutralLight}`,
    borderRadius: 4,
    backgroundColor: palette.white,
  },
  ownerRow: {
    padding: "8px 12px",
    backgroundColor: palette.neutralLighterAlt,
    borderBottom: `1px solid ${palette.neutralLight}`,
  },
  memberRow: {
    padding: "6px 12px",
    borderBottom: `1px solid ${palette.neutralLighter}`,
  },
  ownerLabel: {
    color: palette.neutralSecondary,
    fontWeight: FontWeights.semibold,
  },
  peopleCountLabel: {
    fontWeight: FontWeights.semibold,
    color: palette.neutralSecondary,
  },
  orgWideNotice: {
    padding: "12px 14px",
    backgroundColor: palette.neutralLighterAlt,
    borderRadius: 4,
    border: `1px solid ${palette.neutralLight}`,
    color: palette.neutralPrimary,
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  buttonRow: {
    marginTop: "auto",
    paddingTop: 16,
  },
});

const accessOptions: IDropdownOption[] = [
  { key: "Custom", text: "Restricted" },
  { key: "OrgWide", text: "Anyone in organization with the link" },
];

export const ShareDialog: React.FC<ShareDialogProps> = ({
  isOpen,
  onDismiss,
  resource,
  onSuccess,
}) => {
  if (!resource) return null;

  const [allUsers, setAllUsers] = useState<UserDto[]>([]);
  const [selectedScope, setSelectedScope] = useState<ResourceScope>(
    resource.scope === "OrgWide" ? "OrgWide" : "Custom"
  );
  const [sharedUserIds, setSharedUserIds] = useState<string[]>(resource.sharedWithUserIds || []);
  const [copied, setCopied] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: MessageBarType } | null>(null);

  const shareableUrl = `${window.location.origin}/?tab=shared&id=${resource.id}`;

  useEffect(() => {
    if (isOpen) {
      setSelectedScope(resource.scope === "OrgWide" ? "OrgWide" : "Custom");
      setSharedUserIds(resource.sharedWithUserIds || []);
      setCopied(false);
      setMessage(null);

      getUsers()
        .then((res) => setAllUsers(res.data || []))
        .catch(() => {});
    }
  }, [isOpen, resource]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSaveShare = async () => {
    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await shareResource(resource.id, {
        scope: selectedScope,
        userIds: selectedScope === "Custom" ? sharedUserIds : [],
      });
      setMessage({
        text: response.message || "Resource shared successfully!",
        type: MessageBarType.success,
      });
      setTimeout(() => {
        onSuccess();
        onDismiss();
      }, 1000);
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.message || "Failed to update sharing settings.",
        type: MessageBarType.error,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveUser = (userId: string) => {
    setSharedUserIds((prev) => prev.filter((id) => id !== userId));
  };

  const userOptions: IDropdownOption[] = allUsers
    .filter((u) => u.id !== resource.authorId)
    .map((u) => ({
      key: u.id,
      text: `${u.userName} (${u.email})`,
    }));

  return (
    <Panel
      isLightDismiss
      isOpen={isOpen}
      onDismiss={onDismiss}
      type={PanelType.custom}
      customWidth="540px"
      headerText={`Share: ${resource.title}`}
      closeButtonAriaLabel="Close"
    >
      <Stack tokens={{ childrenGap: 18 }} className={styles.formRoot}>
        {message && (
          <MessageBar messageBarType={message.type}>
            {message.text}
          </MessageBar>
        )}

        <Stack tokens={{ childrenGap: 6 }}>
          <Text className={styles.sectionTitle}>
            Direct Resource Link
          </Text>
          <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
            <TextField
              value={shareableUrl}
              readOnly
              className={styles.urlField}
            />
            <PrimaryButton
              iconProps={{ iconName: copied ? "CheckMark" : "Copy" }}
              text={copied ? "Copied!" : "Copy"}
              onClick={handleCopyLink}
            />
          </Stack>
        </Stack>

        <Dropdown
          label="General Access"
          selectedKey={selectedScope}
          options={accessOptions}
          onChange={(_, option) => setSelectedScope(option?.key as ResourceScope)}
        />

        {selectedScope === "Custom" ? (
          <Stack tokens={{ childrenGap: 14 }}>
            <Dropdown
              label="Add Specific Colleagues"
              placeholder="Select team members to grant access..."
              multiSelect
              selectedKeys={sharedUserIds}
              options={userOptions}
              onChange={(_, option) => {
                if (!option) return;
                setSharedUserIds((prev) =>
                  option.selected
                    ? [...prev, option.key as string]
                    : prev.filter((k) => k !== option.key)
                );
              }}
            />

            <Stack tokens={{ childrenGap: 8 }}>
              <Text variant="small" className={styles.peopleCountLabel}>
                People with access ({sharedUserIds.length + 1}):
              </Text>

              <div className={styles.peopleListScrollable}>
                <Stack
                  horizontal
                  horizontalAlign="space-between"
                  verticalAlign="center"
                  className={styles.ownerRow}
                >
                  <Text variant="small">
                    <Icon iconName="Contact" style={{ marginRight: 6 }} />
                    <strong>{resource.authorName}</strong> (Owner)
                  </Text>
                  <Text variant="small" className={styles.ownerLabel}>
                    Author
                  </Text>
                </Stack>

                {sharedUserIds.map((userId) => {
                  const userObj = allUsers.find((u) => u.id === userId);
                  return (
                    <Stack
                      key={userId}
                      horizontal
                      horizontalAlign="space-between"
                      verticalAlign="center"
                      className={styles.memberRow}
                    >
                      <Text variant="small">
                        <Icon iconName="People" style={{ marginRight: 6 }} />
                        {userObj ? `${userObj.userName} (${userObj.email})` : userId}
                      </Text>
                      <IconButton
                        iconProps={{ iconName: "Cancel" }}
                        title="Remove Access"
                        onClick={() => handleRemoveUser(userId)}
                      />
                    </Stack>
                  );
                })}
              </div>
            </Stack>
          </Stack>
        ) : (
          <div className={styles.orgWideNotice}>
            <Icon iconName="Globe" styles={{ root: { fontSize: 18, color: palette.themePrimary } }} />
            <span>Anyone in your organization with this link can view and download this resource.</span>
          </div>
        )}

        <Stack horizontal horizontalAlign="end" className={styles.buttonRow}>
          <PrimaryButton
            iconProps={{ iconName: "Share" }}
            text={isSubmitting ? "Sharing..." : "Share"}
            onClick={handleSaveShare}
            disabled={isSubmitting}
          />
        </Stack>
      </Stack>
    </Panel>
  );
};

export default ShareDialog;
