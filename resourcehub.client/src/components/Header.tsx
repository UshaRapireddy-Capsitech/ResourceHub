import React, { useState, useRef } from "react";
import { Stack, Text, DefaultButton, Persona, PersonaSize, PersonaPresence, Callout, DirectionalHint, Icon, getTheme, mergeStyleSets } from "@fluentui/react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logout } from "../store/slices/authSlice";

const theme = getTheme();
const { palette } = theme;

const styles = mergeStyleSets({
  headerRoot: {
    height: 64,
    padding: "0 24px",
    backgroundColor: palette.white,
    borderBottom: `1px solid ${palette.neutralLight}`,
  },
  brandText: {
    fontWeight: 700,
    color: palette.themePrimary,
    fontSize: 20,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  },
  profileWrapper: {
    display: "flex",
    alignItems: "center",
    position: "relative",
  },
  avatarButton: {
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    borderRadius: "50%",
    padding: 2,
    transition: "outline 0.2s ease",
  },
  avatarActive: {
    outline: `2px solid ${palette.themePrimary}`,
  },
  avatarInactive: {
    outline: "2px solid transparent",
  },
  calloutMain: {
    padding: "24px 20px",
    width: 240,
    borderRadius: 8,
  },
  profileUserName: {
    fontSize: 16,
    fontWeight: 600,
    color: palette.neutralPrimary,
  },
  profileUserEmail: {
    fontSize: 13,
    color: palette.neutralSecondary,
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
});

export const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [isProfileCalloutOpen, setIsProfileCalloutOpen] = useState<boolean>(false);
  const profileButtonRef = useRef<HTMLDivElement>(null);

  const getRoleDisplayName = (role: any): string => {
    if (typeof role === "string") return role;
    if (role === 0) return "Admin";
    if (role === 1) return "Staff";
    if (role === 2) return "User";
    return String(role || "User");
  };

  const roleName = user ? getRoleDisplayName(user.role) : "";

  const getRoleBadgeClass = (roleStr: string) => {
    switch (roleStr) {
      case "Admin":
        return styles.roleAdmin;
      case "Staff":
        return styles.roleStaff;
      default:
        return styles.roleUser;
    }
  };

  const getRoleIcon = (roleStr: string) => {
    switch (roleStr) {
      case "Admin":
        return "ShieldAlert";
      case "Staff":
        return "Contact";
      default:
        return "People";
    }
  };

  return (
    <Stack
      horizontal
      verticalAlign="center"
      horizontalAlign="space-between"
      className={styles.headerRoot}
    >
      <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
        <Icon iconName="Documentation" styles={{ root: { fontSize: 22, color: palette.themePrimary } }} />
        <Text variant="large" className={styles.brandText}>
          ResourceHub
        </Text>
      </Stack>

      {user && (
        <div className={styles.profileWrapper}>
          <div
            ref={profileButtonRef}
            onClick={() => setIsProfileCalloutOpen(!isProfileCalloutOpen)}
            className={`${styles.avatarButton} ${isProfileCalloutOpen ? styles.avatarActive : styles.avatarInactive}`}
            title={`${user.userName} (${roleName}) - Click for profile details`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsProfileCalloutOpen(!isProfileCalloutOpen);
              }
            }}
          >
            <Persona
              text={user.userName}
              size={PersonaSize.size40}
              hidePersonaDetails={true}
              presence={PersonaPresence.online}
            />
          </div>

          {isProfileCalloutOpen && (
            <Callout
              target={profileButtonRef.current}
              onDismiss={() => setIsProfileCalloutOpen(false)}
              directionalHint={DirectionalHint.bottomRightEdge}
              gapSpace={10}
              setInitialFocus
              styles={{
                calloutMain: styles.calloutMain,
              }}
            >
              <Stack horizontalAlign="center" tokens={{ childrenGap: 14 }}>
                <Persona
                  text={user.userName}
                  size={PersonaSize.size72}
                  hidePersonaDetails={true}
                  presence={PersonaPresence.online}
                />

                <Stack horizontalAlign="center" tokens={{ childrenGap: 2 }}>
                  <Text className={styles.profileUserName}>
                    {user.userName}
                  </Text>
                  <Text className={styles.profileUserEmail}>
                    {user.email}
                  </Text>
                </Stack>

                <span className={`${styles.roleBadge} ${getRoleBadgeClass(roleName)}`}>
                  <Icon iconName={getRoleIcon(roleName)} />
                  {roleName}
                </span>

                <DefaultButton
                  iconProps={{ iconName: "SignOut" }}
                  text="Sign Out"
                  onClick={() => {
                    setIsProfileCalloutOpen(false);
                    dispatch(logout());
                  }}
                />
              </Stack>
            </Callout>
          )}
        </div>
      )}
    </Stack>
  );
};

export default Header;
