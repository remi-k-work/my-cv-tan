// react
import { useId } from "react";

// services, features, and other libraries
import { useFieldContext } from "@/components/form";

// components
import { Input } from "@base-ui/react";
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
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <Input className="input" id={id} name={name} value={value ?? ""} onChange={(ev) => handleChange(ev.target.value)} onBlur={handleBlur} {...props} />
      <FieldErrors />
    </>
  );
}
