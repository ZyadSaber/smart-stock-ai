import { useState } from "react";
import { ZodSchema } from "zod";

interface UseFormManagerProps<T> {
  initialData: T;
  schema?: ZodSchema<T>; // Pass the Zod schema as an optional prop
}

const useFormManager = <T extends Record<string, unknown>>({
  initialData,
  schema,
}: UseFormManagerProps<T>) => {
  const [formData, setFormData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    if (!schema) return true;

    const result = schema.safeParse(formData);
    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        formattedErrors[issue.path.join(".")] = issue.message;
      });
      setErrors(formattedErrors);
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
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
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
