import { UserPermissions } from "@/types/user";

export const ORGANIZATION_FORM_INITIAL_DATA = {
  name: "",
  active: false,
  id: "",
};

export const BRANCH_FORM_INITIAL_DATA = {
  name: "",
  location: "",
  organization_id: "",
  id: "",
};

export const USER_FORM_INITIAL_DATA = {
  full_name: "",
  email: "",
  password: "",
  role: "",
  newPassword: "",
  permissions: {} as UserPermissions,
  organization_id: "",
  branch_id: "",
  isDeleting: false,
  isUpdatingPassword: false,
  showDeleteConfirm: false,
};
