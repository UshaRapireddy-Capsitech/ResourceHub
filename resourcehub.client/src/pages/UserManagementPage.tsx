import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Stack, Text, PrimaryButton, DetailsList, DetailsListLayoutMode, SelectionMode, type IColumn, Panel, PanelType, TextField, Dropdown, type IDropdownOption, MessageBar, MessageBarType, Spinner, SpinnerSize, Icon, getTheme, mergeStyleSets } from "@fluentui/react";
import { getUsers, createUser } from "../api/userApi";
import type { UserDto, Role } from "../types/user";

const roleOptions: IDropdownOption[] = [
  { key: "User", text: "User" },
  { key: "Staff", text: "Staff" },
  { key: "Admin", text: "Admin" },
];

const validationSchema = Yup.object({
  userName: Yup.string().min(2, "Username too short").required("Username is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  role: Yup.string().required("Role is required"),
});

const theme = getTheme();
const { palette } = theme;

const styles = mergeStyleSets({
  container: {
    padding: 24,
  },
  tableWrapper: {
    backgroundColor: palette.white,
    borderRadius: 4,
    border: `1px solid ${palette.neutralLight}`,
  },
  userNameText: {
    fontWeight: 600,
  },
  roleBadge: {
    fontSize: 12,
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  },
  roleAdmin: {
    color: palette.redDark,
  },
  roleStaff: {
    color: palette.themePrimary,
  },
  roleUser: {
    color: palette.green,
  },
  formContainer: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    height: "100%",
    paddingTop: 10,
  },
  formBody: {
    flex: 1,
  },
  buttonRow: {
    marginTop: "auto",
    paddingTop: 16,
  },
  spinnerSpacing: {
    marginTop: 40,
  },
});

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: MessageBarType } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await getUsers();
      setUsers(response.data || []);
    } catch (err: any) {
      setStatusMessage({
        text: err.response?.data?.message || "Failed to load users.",
        type: MessageBarType.error,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const formik = useFormik({
    initialValues: {
      userName: "",
      email: "",
      role: "User" as Role,
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const response = await createUser(values);
        setStatusMessage({
          text: response.message || "User created successfully.",
          type: MessageBarType.success,
        });
        resetForm();
        setIsPanelOpen(false);
        fetchUsers();
      } catch (err: any) {
        setStatusMessage({
          text: err.response?.data?.message || "Failed to create user.",
          type: MessageBarType.error,
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const columns: IColumn[] = [
    {
      key: "userName",
      name: "User Name",
      fieldName: "userName",
      minWidth: 140,
      maxWidth: 200,
      isResizable: true,
      onRender: (item: UserDto) => <Text className={styles.userNameText}>{item.userName}</Text>,
    },
    {
      key: "email",
      name: "Email Address",
      fieldName: "email",
      minWidth: 200,
      maxWidth: 260,
      isResizable: true,
    },
    {
      key: "role",
      name: "Assigned Role",
      fieldName: "role",
      minWidth: 100,
      maxWidth: 140,
      isResizable: true,
      onRender: (item: UserDto) => {
        const roleClass =
          item.role === "Admin"
            ? styles.roleAdmin
            : item.role === "Staff"
            ? styles.roleStaff
            : styles.roleUser;

        const roleIcon =
          item.role === "Admin"
            ? "ShieldAlert"
            : item.role === "Staff"
            ? "Contact"
            : "People";

        return (
          <span className={`${styles.roleBadge} ${roleClass}`}>
            <Icon iconName={roleIcon} />
            {item.role}
          </span>
        );
      },
    },
    {
      key: "createdAt",
      name: "Created Date",
      fieldName: "createdAt",
      minWidth: 140,
      maxWidth: 180,
      onRender: (item: UserDto) => new Date(item.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <Stack tokens={{ childrenGap: 16 }} className={styles.container}>
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
        <Text variant="xLarge">
          User Management
        </Text>

        <PrimaryButton
          iconProps={{ iconName: "Add" }}
          text="Add User"
          onClick={() => {
            formik.resetForm();
            setIsPanelOpen(true);
          }}
        />
      </Stack>

      {statusMessage && (
        <MessageBar messageBarType={statusMessage.type} onDismiss={() => setStatusMessage(null)}>
          {statusMessage.text}
        </MessageBar>
      )}

      {loading ? (
        <Spinner size={SpinnerSize.large} label="Loading users..." className={styles.spinnerSpacing} />
      ) : (
        <div className={styles.tableWrapper}>
          <DetailsList
            items={users}
            columns={columns}
            selectionMode={SelectionMode.none}
            layoutMode={DetailsListLayoutMode.justified}
            isHeaderVisible={true}
          />
        </div>
      )}

      <Panel
        isLightDismiss
        isOpen={isPanelOpen}
        onDismiss={() => setIsPanelOpen(false)}
        type={PanelType.custom}
        customWidth="520px"
        headerText="Create new user"
        closeButtonAriaLabel="Close"
      >
        <form onSubmit={formik.handleSubmit} className={styles.formContainer}>
          <Stack tokens={{ childrenGap: 18 }} className={styles.formBody}>
            <TextField
              label="Full User Name"
              name="userName"
              placeholder="Enter user full name"
              value={formik.values.userName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              errorMessage={formik.touched.userName && formik.errors.userName ? formik.errors.userName : undefined}
              required
            />

            <TextField
              label="Email Address"
              name="email"
              type="email"
              placeholder="Enter user email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              errorMessage={formik.touched.email && formik.errors.email ? formik.errors.email : undefined}
              required
            />

            <Dropdown
              label="System Role"
              selectedKey={formik.values.role}
              options={roleOptions}
              onChange={(_, option) => formik.setFieldValue("role", option?.key)}
              required
            />

            <MessageBar messageBarType={MessageBarType.info}>
              New user default password is: <strong>welcome</strong>
            </MessageBar>

            <Stack horizontal horizontalAlign="end" className={styles.buttonRow}>
              <PrimaryButton
                type="submit"
                iconProps={{ iconName: "Save" }}
                text={formik.isSubmitting ? "Creating..." : "Create User"}
                disabled={formik.isSubmitting}
              />
            </Stack>
          </Stack>
        </form>
      </Panel>
    </Stack>
  );
};

export default UserManagementPage;
