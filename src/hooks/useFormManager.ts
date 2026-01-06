import { useState } from "react";
import { ZodSchema, z } from "zod";

interface UseFormManagerProps<T> {
  initialData: T;
  schema?: ZodSchema<T>; // Pass the Zod schema as an optional prop
}

const useFormManager = <T extends Record<string, unknown>>({
  initialData,
  schema,
}: UseFormManagerProps<T>) => {
  const [formData, setFormData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const validate = (): boolean => {
    if (!schema) return true;

    const result = schema.safeParse(formData);
    if (!result.success) {
      const treeified = z.treeifyError(result.error);
      const formattedErrors: Record<string, string> = Object.fromEntries(
        Object.entries(treeified.properties || {}).map(([key, value]) => [
          key,
          value?.errors?.[0] || "",
        ])
      );
      setErrors(formattedErrors as Partial<Record<keyof T, string>>);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    customValue?: unknown
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: customValue || type === "number" ? +value : value,
    }));

    // Optional: Clear error for this field as the user types
    if (errors[name as keyof T]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const resetForm = () => {
    setFormData(initialData);
    setErrors({});
  };

  const handleToggle = (name: string) => (value: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFieldChange = ({
    name,
    value,
  }: {
    name: string;
    value: unknown;
  }) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangeMultiInputs = (data: Record<string, unknown>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  return {
    formData,
    setFormData,
    handleChange,
    resetForm,
    validate, // Call this before submitting
    errors, // Display these in your UI
    handleToggle,
    handleFieldChange,
    handleChangeMultiInputs,
  };
};

export default useFormManager;
