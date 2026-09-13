// react
import { useId } from "react";

// other libraries
import { useFieldContext } from "@/components/form";

// components
import { Label } from "@/components/ui/custom/label";
import { Input } from "@/components/ui/custom/input";
import FieldErrors from "@/components/form/field-errors";

// types
import type { ComponentPropsWithoutRef } from "react";

interface TextFieldProps extends ComponentPropsWithoutRef<typeof Input> {
  label: string;
}

export default function TextField({ label, ...props }: TextFieldProps) {
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
      <Input id={id} name={name} value={value ?? ""} onChange={(ev) => handleChange(ev.target.value)} onBlur={handleBlur} {...props} />
      <FieldErrors />
    </>
  );
}
