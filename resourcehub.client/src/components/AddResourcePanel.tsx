import React, { useEffect, useState, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Panel, PanelType, Stack, TextField, Dropdown, type IDropdownOption, PrimaryButton, IconButton, MessageBar, MessageBarType, Text, FontWeights, Icon, getTheme, mergeStyleSets } from "@fluentui/react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import { ClassicEditor, Alignment, BlockQuote, Bold, Essentials, FontBackgroundColor, FontColor, FontFamily, FontSize, Heading, Indent, IndentBlock, Italic, Link, List, Paragraph, RemoveFormat, Strikethrough, Table, TableToolbar, Underline, Undo } from "ckeditor5";
import "ckeditor5/ckeditor5.css";
import { createResource, updateResource } from "../api/resourceApi";
import type { ResourceDto, ResourceScope } from "../types/resource";

interface AddResourcePanelProps {
  isOpen: boolean;
  onDismiss: () => void;
  onSuccess: () => void;
  resourceToEdit?: ResourceDto | null;
}

const recipientOptions: IDropdownOption[] = [
  { key: "OnlyMe", text: "Only Me" },
  { key: "Custom", text: "Custom" },
  { key: "OrgWide", text: "Organisation-Wide" },
];

const validationSchema = Yup.object({
  title: Yup.string().trim().required("Title is required"),
  content: Yup.string()
    .test("not-empty", "Summary is required", (val) => {
      if (!val) return false;
      const stripped = val.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, "").trim();
      return stripped.length > 0;
    })
    .required("Summary is required"),
  scope: Yup.string().required("Target audience is required"),
});

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
  formStack: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    height: "100%",
  },
  summaryLabel: {
    fontWeight: FontWeights.semibold,
    fontSize: 14,
  },
  editorWrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: 280,
    borderRadius: 4,
  },
  editorWrapperError: {
    border: `1px solid ${palette.redDark}`,
    borderRadius: 4,
  },
  errorText: {
    color: palette.redDark,
    fontSize: 12,
  },
  dropzoneBase: {
    borderRadius: 4,
    padding: "16px 12px",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  dropzoneNormal: {
    border: `1.5px dashed ${palette.neutralLight}`,
    backgroundColor: palette.neutralLighterAlt,
  },
  dropzoneActive: {
    border: `2px dashed ${palette.themePrimary}`,
    backgroundColor: palette.neutralLight,
  },
  selectedFileText: {
    fontSize: 13,
    color: palette.green,
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  },
  currentFileText: {
    fontSize: 13,
    color: palette.themePrimary,
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  },
  dropzonePromptText: {
    fontSize: 13,
    color: palette.neutralSecondary,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },
  buttonRow: {
    marginTop: "auto",
    paddingTop: 16,
  },
  hiddenInput: {
    display: "none",
  },
});

const editorConfig = {
  licenseKey: "GPL",
  toolbar: {
    items: [
      "heading",
      "|",
      "fontSize",
      "fontFamily",
      "|",
      "bold",
      "italic",
      "underline",
      "strikethrough",
      "removeFormat",
      "|",
      "fontColor",
      "fontBackgroundColor",
      "|",
      "alignment",
      "|",
      "link",
      "bulletedList",
      "numberedList",
      "outdent",
      "indent",
      "|",
      "blockQuote",
      "insertTable",
      "|",
      "undo",
      "redo",
    ],
    shouldNotGroupWhenFull: true,
  },
  plugins: [
    Alignment,
    BlockQuote,
    Bold,
    Essentials,
    FontBackgroundColor,
    FontColor,
    FontFamily,
    FontSize,
    Heading,
    Indent,
    IndentBlock,
    Italic,
    Link,
    List,
    Paragraph,
    RemoveFormat,
    Strikethrough,
    Table,
    TableToolbar,
    Underline,
    Undo,
  ],
  table: {
    contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"],
  },
};

export const AddResourcePanel: React.FC<AddResourcePanelProps> = ({
  isOpen,
  onDismiss,
  onSuccess,
  resourceToEdit,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeExistingAttachment, setRemoveExistingAttachment] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (serverError) {
      const timer = setTimeout(() => setServerError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [serverError]);

  const formik = useFormik({
    initialValues: {
      title: "",
      content: "",
      scope: "OnlyMe" as ResourceScope,
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setServerError(null);
      try {
        const sendForReview = values.scope === "OrgWide";

        if (resourceToEdit) {
          await updateResource(resourceToEdit.id, {
            title: values.title,
            content: values.content,
            scope: values.scope,
            sharedWithUserIds: resourceToEdit.sharedWithUserIds || [],
            sendForReview,
            attachment: selectedFile || undefined,
            removeExistingAttachment,
          });
        } else {
          await createResource({
            title: values.title,
            content: values.content,
            scope: values.scope,
            sharedWithUserIds: [],
            sendForReview,
            attachment: selectedFile || undefined,
          });
        }
        onSuccess();
        onDismiss();
      } catch (err: any) {
        setServerError(err.response?.data?.message || "Failed to save resource.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (resourceToEdit) {
      formik.setValues({
        title: resourceToEdit.title,
        content: resourceToEdit.content,
        scope: resourceToEdit.scope || "OnlyMe",
      });
      setSelectedFile(null);
      setRemoveExistingAttachment(false);
    } else {
      formik.resetForm();
      setSelectedFile(null);
      setRemoveExistingAttachment(false);
    }
  }, [resourceToEdit, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setRemoveExistingAttachment(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
      setRemoveExistingAttachment(false);
    }
  };

  return (
    <Panel
      isLightDismiss
      isOpen={isOpen}
      onDismiss={onDismiss}
      type={PanelType.custom}
      customWidth="600px"
      headerText={resourceToEdit ? `Edit resource: ${resourceToEdit.refNo}` : "Create resource"}
      closeButtonAriaLabel="Close"
    >
      <form
        onSubmit={formik.handleSubmit}
        className={styles.formRoot}
      >
        <Stack
          tokens={{ childrenGap: 14 }}
          className={styles.formStack}
        >
          {serverError && (
            <MessageBar messageBarType={MessageBarType.error}>
              {serverError}
            </MessageBar>
          )}

          {resourceToEdit?.reviewNote && (
            <MessageBar messageBarType={MessageBarType.warning}>
              <strong>Review Feedback:</strong> {resourceToEdit.reviewNote}
            </MessageBar>
          )}

          <TextField
            label="Title"
            name="title"
            value={formik.values.title}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            errorMessage={formik.touched.title && formik.errors.title ? formik.errors.title : undefined}
            required
          />

          <Dropdown
            label="Publishing Intent"
            selectedKey={formik.values.scope}
            options={recipientOptions}
            onChange={(_, option) => formik.setFieldValue("scope", option?.key)}
            required
          />

          <Stack tokens={{ childrenGap: 6 }} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Text className={styles.summaryLabel}>
              Summary <span style={{ color: palette.redDark }}>*</span>
            </Text>
            <div
              className={`${styles.editorWrapper} ${
                formik.touched.content && formik.errors.content ? styles.editorWrapperError : ""
              }`}
            >
              <CKEditor
                editor={ClassicEditor}
                config={editorConfig}
                data={formik.values.content}
                onChange={(_, editor) => {
                  const data = editor.getData();
                  formik.setFieldValue("content", data);
                }}
                onBlur={() => {
                  formik.setFieldTouched("content", true);
                }}
              />
            </div>
            {formik.touched.content && formik.errors.content && (
              <Text className={styles.errorText}>
                {formik.errors.content}
              </Text>
            )}
          </Stack>

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`${styles.dropzoneBase} ${isDragging ? styles.dropzoneActive : styles.dropzoneNormal}`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className={styles.hiddenInput}
            />

            {selectedFile ? (
              <Stack horizontal horizontalAlign="center" verticalAlign="center" tokens={{ childrenGap: 8 }}>
                <Text className={styles.selectedFileText}>
                  <Icon iconName="Attach" />
                  {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                </Text>
                <IconButton
                  iconProps={{ iconName: "Cancel" }}
                  title="Remove file"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                />
              </Stack>
            ) : resourceToEdit?.attachmentOriginalName && !removeExistingAttachment ? (
              <Stack horizontal horizontalAlign="center" verticalAlign="center" tokens={{ childrenGap: 8 }}>
                <Text className={styles.currentFileText}>
                  <Icon iconName="Attach" />
                  Current: {resourceToEdit.attachmentOriginalName} ({Math.round((resourceToEdit.attachmentFileSize || 0) / 1024)} KB)
                </Text>
                <IconButton
                  iconProps={{ iconName: "Delete" }}
                  title="Remove attachment"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRemoveExistingAttachment(true);
                  }}
                />
              </Stack>
            ) : (
              <Text className={styles.dropzonePromptText}>
                <Icon iconName="CloudUpload" styles={{ root: { fontSize: 18 } }} />
                Select or drop files
              </Text>
            )}
          </div>

          <Stack horizontal horizontalAlign="end" className={styles.buttonRow}>
            <PrimaryButton
              type="submit"
              iconProps={{ iconName: "Save" }}
              text={formik.isSubmitting ? "Saving..." : "Save"}
              disabled={formik.isSubmitting}
            />
          </Stack>
        </Stack>
      </form>
    </Panel>
  );
};

export default AddResourcePanel;
