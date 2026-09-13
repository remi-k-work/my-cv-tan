// react
import { useId } from "react";

// other libraries
import { useFieldContext } from "@/components/form";

// components
import { Label } from "@/components/ui/custom/label";
import { Textarea } from "@/components/ui/custom/textarea";
import FieldErrors from "@/components/form/field-errors";

// types
import type { ComponentPropsWithoutRef } from "react";

interface TextAreaFieldProps extends ComponentPropsWithoutRef<typeof Textarea> {
  label: string;
}

export default function TextAreaField({ label, ...props }: TextAreaFieldProps) {
  // Get the field context
  const {
    name,
    state: { value },
    handleChange,
    handleBlur,
  } = useFieldContext<string>();

  // Generate a unique id
  const id = useId();

  return (
    <>
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} name={name} value={value ?? ""} onChange={(ev) => handleChange(ev.target.value)} onBlur={handleBlur} {...props} />
      <FieldErrors />
    </>
  );
}
