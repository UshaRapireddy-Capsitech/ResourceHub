import React from "react";
import { Panel, PanelType, Stack, Text, TextField, PrimaryButton, MessageBar, MessageBarType, FontWeights, Icon, getTheme, mergeStyleSets } from "@fluentui/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import type { ResourceDto, ResourceStatus } from "../types/resource";
import { reviewResource } from "../api/resourceApi";

interface ReviewDialogProps {
  isOpen: boolean;
  onDismiss: () => void;
  resource: ResourceDto | null;
  onSuccess: () => void;
}

interface FormValues {
  status: ResourceStatus;
  reviewNote: string;
}

const validationSchema = Yup.object().shape({
  status: Yup.string()
    .oneOf(["Approved", "Rejected"], "Invalid status")
    .required("Review status is required"),
  reviewNote: Yup.string().when("status", {
    is: "Rejected",
    then: (schema) => schema.required("Rejection reason or feedback is required"),
    otherwise: (schema) => schema.optional(),
  }),
});

const theme = getTheme();
const { palette } = theme;

const styles = mergeStyleSets({
  formRoot: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    height: "100%",
    paddingTop: 10,
  },
  summaryCard: {
    backgroundColor: palette.neutralLighterAlt,
    padding: "14px 18px",
    borderRadius: 4,
    border: `1px solid ${palette.neutralLight}`,
  },
  summaryTitle: {
    fontWeight: FontWeights.semibold,
    fontSize: 15,
    color: palette.neutralPrimary,
  },
  summaryMetaText: {
    fontSize: 12,
    color: palette.neutralSecondary,
  },
  summaryMetaStrong: {
    color: palette.neutralPrimary,
  },
  summaryAttachmentRow: {
    fontSize: 12,
    color: palette.themePrimary,
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  decisionLabel: {
    fontWeight: FontWeights.semibold,
    fontSize: 13,
    color: palette.neutralPrimary,
  },
  decisionCardBase: {
    flex: 1,
    cursor: "pointer",
    padding: "12px 16px",
    borderRadius: 4,
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  decisionCardNormal: {
    border: `1px solid ${palette.neutralLight}`,
    backgroundColor: palette.white,
  },
  decisionCardApproved: {
    border: `2px solid ${palette.green}`,
    backgroundColor: palette.neutralLighterAlt,
  },
  decisionCardRejected: {
    border: `2px solid ${palette.redDark}`,
    backgroundColor: palette.neutralLighterAlt,
  },
  decisionIcon: {
    fontSize: 16,
    fontWeight: 700,
  },
  decisionIconApproved: {
    color: palette.green,
  },
  decisionIconRejected: {
    color: palette.redDark,
  },
  decisionIconInactive: {
    color: palette.neutralTertiary,
  },
  decisionText: {
    fontWeight: FontWeights.semibold,
    fontSize: 14,
  },
  decisionTextApproved: {
    color: palette.green,
  },
  decisionTextRejected: {
    color: palette.redDark,
  },
  decisionTextInactive: {
    color: palette.neutralPrimary,
  },
  buttonRow: {
    marginTop: "auto",
    paddingTop: 16,
  },
});

export const ReviewDialog: React.FC<ReviewDialogProps> = ({
  isOpen,
  onDismiss,
  resource,
  onSuccess,
}) => {
  const [apiError, setApiError] = React.useState<string | null>(null);

  const formik = useFormik<FormValues>({
    initialValues: {
      status: "Approved",
      reviewNote: "",
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      if (!resource) return;
      setApiError(null);
      try {
        await reviewResource(resource.id, {
          status: values.status,
          reviewNote: values.reviewNote.trim() ? values.reviewNote.trim() : undefined,
        });
        onSuccess();
        onDismiss();
      } catch (err: any) {
        setApiError(err.response?.data?.message || "Failed to submit review. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  if (!resource) return null;

  const isApproved = formik.values.status === "Approved";
  const isRejected = formik.values.status === "Rejected";

  return (
    <Panel
      isLightDismiss
      isOpen={isOpen}
      onDismiss={() => {
        formik.resetForm();
        setApiError(null);
        onDismiss();
      }}
      type={PanelType.custom}
      customWidth="540px"
      headerText={`Review submission: ${resource.refNo}`}
      closeButtonAriaLabel="Close"
    >
      <form
        onSubmit={formik.handleSubmit}
        className={styles.formRoot}
      >
        <Stack tokens={{ childrenGap: 20 }} style={{ flex: 1 }}>
          {apiError && (
            <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setApiError(null)}>
              {apiError}
            </MessageBar>
          )}

          <Stack
            tokens={{ childrenGap: 6 }}
            className={styles.summaryCard}
          >
            <Text className={styles.summaryTitle}>
              {resource.title}
            </Text>
            <Text className={styles.summaryMetaText}>
              Submitted by: <strong className={styles.summaryMetaStrong}>{resource.authorName}</strong>
            </Text>
            <Text className={styles.summaryMetaText}>
              Target Scope: <strong className={styles.summaryMetaStrong}>{resource.scope === "OrgWide" ? "Organisation-Wide" : "Only Me"}</strong>
            </Text>
            {resource.hasAttachment && (
              <Text className={styles.summaryAttachmentRow}>
                <Icon iconName="Attach" />
                Attachment: <strong>{resource.attachmentOriginalName}</strong>
              </Text>
            )}
          </Stack>

          <Stack tokens={{ childrenGap: 8 }}>
            <Text className={styles.decisionLabel}>
              Decision
            </Text>

            <Stack horizontal tokens={{ childrenGap: 12 }}>
              <div
                onClick={() => formik.setFieldValue("status", "Approved")}
                className={`${styles.decisionCardBase} ${
                  isApproved ? styles.decisionCardApproved : styles.decisionCardNormal
                }`}
              >
                <Icon
                  iconName="CheckMark"
                  className={`${styles.decisionIcon} ${
                    isApproved ? styles.decisionIconApproved : styles.decisionIconInactive
                  }`}
                />
                <Text
                  className={`${styles.decisionText} ${
                    isApproved ? styles.decisionTextApproved : styles.decisionTextInactive
                  }`}
                >
                  Approve
                </Text>
              </div>

              <div
                onClick={() => formik.setFieldValue("status", "Rejected")}
                className={`${styles.decisionCardBase} ${
                  isRejected ? styles.decisionCardRejected : styles.decisionCardNormal
                }`}
              >
                <Icon
                  iconName="Cancel"
                  className={`${styles.decisionIcon} ${
                    isRejected ? styles.decisionIconRejected : styles.decisionIconInactive
                  }`}
                />
                <Text
                  className={`${styles.decisionText} ${
                    isRejected ? styles.decisionTextRejected : styles.decisionTextInactive
                  }`}
                >
                  Reject
                </Text>
              </div>
            </Stack>
          </Stack>

          <TextField
            label={isRejected ? "Rejection Reason (Required)" : "Review Note / Feedback (Optional)"}
            multiline
            rows={4}
            name="reviewNote"
            value={formik.values.reviewNote}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder={
              isRejected
                ? "Explain why this resource was rejected and what changes are required..."
                : "Add any optional comments, commendations, or editorial notes..."
            }
            errorMessage={
              formik.touched.reviewNote && formik.errors.reviewNote
                ? formik.errors.reviewNote
                : undefined
            }
            required={isRejected}
          />

          <Stack horizontal horizontalAlign="end" className={styles.buttonRow}>
            <PrimaryButton
              type="submit"
              iconProps={{ iconName: isApproved ? "CheckMark" : "Cancel" }}
              text={
                formik.isSubmitting
                  ? "Submitting..."
                  : isApproved
                  ? "Approve"
                  : "Reject"
              }
              disabled={formik.isSubmitting}
            />
          </Stack>
        </Stack>
      </form>
    </Panel>
  );
};

export default ReviewDialog;
