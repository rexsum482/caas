const ctx = window.DJANGO_CONTEXT || {};

export const AppContext = {
  companyName: ctx.companyName || "",
  adminEmail: ctx.adminEmail || "",
  primaryColor: ctx.primaryColor || "#2f80ed",
  accentColor: ctx.accentColor || "#215199ff",
  alertColor: ctx.alertColor || "#dc2626",
  warningColor: ctx.warningColor || "#f59e0b",
  successColor: ctx.successColor || "#22c55e",
  businessHours: ctx.businessHours || {},
  csrfToken: ctx.csrfToken || "",
};
