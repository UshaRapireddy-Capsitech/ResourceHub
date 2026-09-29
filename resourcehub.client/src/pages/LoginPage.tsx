import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Stack, type IStackTokens, TextField, PrimaryButton, MessageBar, MessageBarType, Spinner, SpinnerSize, Text, FontWeights, Icon, getTheme, mergeStyleSets } from "@fluentui/react";
import { useAppDispatch } from "../store/hooks";
import { setCredentials } from "../store/slices/authSlice";
import { loginUser } from "../api/authApi";
import type { LoginDto } from "../types/user";

const validationSchema = Yup.object({
  email: Yup.string().email("Invalid email address").required("Email is required"),
  password: Yup.string().required("Password is required"),
});

const stackTokens: IStackTokens = { childrenGap: 15 };

const theme = getTheme();
const { palette } = theme;

const styles = mergeStyleSets({
  pageRoot: {
    minHeight: "100vh",
    backgroundColor: palette.neutralLighterAlt,
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: palette.white,
    padding: 32,
    borderRadius: 6,
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
    border: `1px solid ${palette.neutralLight}`,
  },
  brandTitle: {
    fontWeight: FontWeights.bold,
    color: palette.themePrimary,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  },
  brandHeader: {
    marginBottom: 12,
  },
  submitButton: {
    height: 40,
    marginTop: 10,
  },
  spinner: {
    marginRight: 8,
  },
});

export const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formik = useFormik<LoginDto>({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setErrorMessage(null);
      try {
        const response = await loginUser(values);
        if (response.data) {
          dispatch(
            setCredentials({
              user: response.data.user,
              token: response.data.token,
            })
          );
        } else {
          setErrorMessage(response.message || "Invalid credentials.");
        }
      } catch (err: any) {
        setErrorMessage(
          err.response?.data?.message || "Failed to connect to the server. Please ensure the backend is running."
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Stack
      horizontalAlign="center"
      verticalAlign="center"
      className={styles.pageRoot}
    >
      <Stack
        tokens={stackTokens}
        className={styles.card}
      >
        <Stack horizontalAlign="center" tokens={{ childrenGap: 4 }} className={styles.brandHeader}>
          <Text variant="xxLarge" className={styles.brandTitle}>
            <Icon iconName="Documentation" />
            ResourceHub
          </Text>
        </Stack>

        {errorMessage && (
          <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setErrorMessage(null)}>
            {errorMessage}
          </MessageBar>
        )}

        <form onSubmit={formik.handleSubmit}>
          <Stack tokens={stackTokens}>
            <TextField
              label="Email Address"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              errorMessage={formik.touched.email && formik.errors.email ? formik.errors.email : undefined}
              required
            />

            <TextField
              label="Password"
              name="password"
              type="password"
              placeholder="Enter your password"
              canRevealPassword
              revealPasswordAriaLabel="Show password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              errorMessage={formik.touched.password && formik.errors.password ? formik.errors.password : undefined}
              required
            />

            <PrimaryButton
              type="submit"
              text={formik.isSubmitting ? "Signing in..." : "Sign In"}
              disabled={formik.isSubmitting || !formik.isValid}
              className={styles.submitButton}
            >
              {formik.isSubmitting && <Spinner size={SpinnerSize.small} className={styles.spinner} />}
            </PrimaryButton>
          </Stack>
        </form>
      </Stack>
    </Stack>
  );
};

export default LoginPage;
