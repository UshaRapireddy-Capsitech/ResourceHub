import React from "react";
import { Nav, type INavLinkGroup, type INavStyles } from "@fluentui/react";
import { useAppSelector } from "../store/hooks";

export type NavTab = "my" | "shared" | "pending" | "users";

interface SidebarProps {
  selectedTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

const navStyles: Partial<INavStyles> = {
  root: {
    width: 220,
    minHeight: "calc(100vh - 64px)",
    backgroundColor: "#faf9f8",
    borderRight: "1px solid #edebe9",
    paddingTop: 16,
  },
};

export const Sidebar: React.FC<SidebarProps> = ({ selectedTab, onSelectTab }) => {
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === "Admin";

  const navGroups: INavLinkGroup[] = [
    {
      name: "",
      links: [
        {
          name: "My Resources",
          url: "",
          key: "my",
          icon: "PageList",
          onClick: (e) => {
            e?.preventDefault();
            onSelectTab("my");
          },
        },
        {
          name: "Shared Resources",
          url: "",
          key: "shared",
          icon: "Globe",
          onClick: (e) => {
            e?.preventDefault();
            onSelectTab("shared");
          },
        },
        ...(isAdmin
          ? [
              {
                name: "Approval Queue",
                url: "",
                key: "pending",
                icon: "Clock",
                onClick: (e: any) => {
                  e?.preventDefault();
                  onSelectTab("pending");
                },
              },
              {
                name: "User Management",
                url: "",
                key: "users",
                icon: "People",
                onClick: (e: any) => {
                  e?.preventDefault();
                  onSelectTab("users");
                },
              },
            ]
          : []),
      ],
    },
  ];

  return (
    <Nav
      selectedKey={selectedTab}
      groups={navGroups}
      styles={navStyles}
      ariaLabel="ResourceHub Main Navigation"
    />
  );
};

export default Sidebar;
