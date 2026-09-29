import React, { useState, useEffect } from "react";
import { getTheme, mergeStyleSets, MessageBar, MessageBarType } from "@fluentui/react";
import { useAppSelector } from "./store/hooks";
import { Header } from "./components/Header";
import { Sidebar, type NavTab } from "./components/Sidebar";
import { LoginPage } from "./pages/LoginPage";
import { MyResourcesPage } from "./pages/MyResourcesPage";
import { SharedResourcesPage } from "./pages/SharedResourcesPage";
import { ApprovalQueuePage } from "./pages/ApprovalQueuePage";
import { UserManagementPage } from "./pages/UserManagementPage";
import { AddResourcePanel } from "./components/AddResourcePanel";
import { ResourceDetailsModal } from "./components/ResourceDetailsModal";
import { ShareDialog } from "./components/ShareDialog";
import { ReviewDialog } from "./components/ReviewDialog";
import type { ResourceDto } from "./types/resource";
import { getResourceById } from "./api/resourceApi";

const theme = getTheme();
const { palette } = theme;

const styles = mergeStyleSets({
  appContainer: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
  },
  mainLayout: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  contentArea: {
    flex: 1,
    backgroundColor: palette.neutralLighterAlt,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
  },
});

export const App: React.FC = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === "Admin";

  const [activeTab, setActiveTab] = useState<NavTab>("my");
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const [isAddPanelOpen, setIsAddPanelOpen] = useState<boolean>(false);
  const [editingResource, setEditingResource] = useState<ResourceDto | null>(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const [selectedResourceForDetails, setSelectedResourceForDetails] = useState<ResourceDto | null>(null);

  const [isShareDialogOpen, setIsShareDialogOpen] = useState<boolean>(false);
  const [selectedResourceForShare, setSelectedResourceForShare] = useState<ResourceDto | null>(null);

  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState<boolean>(false);
  const [selectedResourceForReview, setSelectedResourceForReview] = useState<ResourceDto | null>(null);
  const [urlErrorMessage, setUrlErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as NavTab;
      const idParam = params.get("id");

      if (tabParam && ["my", "shared", "pending", "users"].includes(tabParam)) {
        if ((tabParam === "pending" || tabParam === "users") && !isAdmin) {
          setActiveTab("my");
        } else {
          setActiveTab(tabParam);
        }
      } else {
        setActiveTab("my");
      }

      if (idParam) {
        getResourceById(idParam)
          .then((res) => {
            if (res.data) {
              setSelectedResourceForDetails(res.data);
              setIsDetailsModalOpen(true);
            }
          })
          .catch((err: any) => {
            const msg = err.response?.data?.message || "Requested resource could not be found or you do not have permission to view it.";
            setUrlErrorMessage(msg);
          });
      }
    }
  }, [isAuthenticated, isAdmin]);

  useEffect(() => {
    if (urlErrorMessage) {
      const timer = setTimeout(() => setUrlErrorMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [urlErrorMessage]);

  const handleRefreshData = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleOpenAddResource = () => {
    setEditingResource(null);
    setIsAddPanelOpen(true);
  };

  const handleOpenEditResource = (resource: ResourceDto) => {
    setEditingResource(resource);
    setIsAddPanelOpen(true);
  };

  const handleOpenViewDetails = (resource: ResourceDto) => {
    setSelectedResourceForDetails(resource);
    setIsDetailsModalOpen(true);
  };

  const handleOpenShare = (resource: ResourceDto) => {
    setSelectedResourceForShare(resource);
    setIsShareDialogOpen(true);
  };

  const handleOpenReview = (resource: ResourceDto) => {
    setSelectedResourceForReview(resource);
    setIsReviewDialogOpen(true);
  };

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className={styles.appContainer}>
      <Header />

      <div className={styles.mainLayout}>
        <Sidebar selectedTab={activeTab} onSelectTab={setActiveTab} />
        <main className={styles.contentArea}>
          {urlErrorMessage && (
            <MessageBar
              messageBarType={MessageBarType.error}
              isMultiline={false}
              onDismiss={() => setUrlErrorMessage(null)}
              dismissButtonAriaLabel="Close"
              styles={{ root: { margin: "12px 24px 0 24px" } }}
            >
              {urlErrorMessage}
            </MessageBar>
          )}

          {activeTab === "my" && (
            <MyResourcesPage
              key={`my-${refreshKey}`}
              onAddResource={handleOpenAddResource}
              onEditResource={handleOpenEditResource}
              onViewResource={handleOpenViewDetails}
              onShareResource={handleOpenShare}
            />
          )}

          {activeTab === "shared" && (
            <SharedResourcesPage
              key={`shared-${refreshKey}`}
              onViewResource={handleOpenViewDetails}
              onShareResource={handleOpenShare}
            />
          )}

          {activeTab === "pending" && isAdmin && (
            <ApprovalQueuePage
              key={`pending-${refreshKey}`}
              onViewResource={handleOpenViewDetails}
              onOpenReviewDialog={handleOpenReview}
            />
          )}

          {activeTab === "users" && isAdmin && (
            <UserManagementPage key={`users-${refreshKey}`} />
          )}
        </main>
      </div>

      <AddResourcePanel
        isOpen={isAddPanelOpen}
        resourceToEdit={editingResource}
        onDismiss={() => {
          setIsAddPanelOpen(false);
          setEditingResource(null);
        }}
        onSuccess={handleRefreshData}
      />

      <ResourceDetailsModal
        isOpen={isDetailsModalOpen}
        resource={selectedResourceForDetails}
        onDismiss={() => {
          setIsDetailsModalOpen(false);
          setSelectedResourceForDetails(null);
        }}
        onOpenShareDialog={(resource) => {
          setSelectedResourceForDetails(null);
          handleOpenShare(resource);
        }}
      />

      <ShareDialog
        isOpen={isShareDialogOpen}
        resource={selectedResourceForShare}
        onDismiss={() => {
          setIsShareDialogOpen(false);
          setSelectedResourceForShare(null);
        }}
        onSuccess={handleRefreshData}
      />

      <ReviewDialog
        isOpen={isReviewDialogOpen}
        resource={selectedResourceForReview}
        onDismiss={() => {
          setIsReviewDialogOpen(false);
          setSelectedResourceForReview(null);
        }}
        onSuccess={handleRefreshData}
      />
    </div>
  );
};

export default App;
