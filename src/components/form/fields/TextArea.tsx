// react
import { useId } from "react";

// services, features, and other libraries
import { useFieldContext } from "@/components/form";

// components
import FieldErrors from "@/components/form/field-errors";

// types
import type { ComponentPropsWithoutRef } from "react";

interface TextAreaFieldProps extends ComponentPropsWithoutRef<"textarea"> {
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
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <textarea className="textarea" id={id} name={name} value={value ?? ""} onChange={(ev) => handleChange(ev.target.value)} onBlur={handleBlur} {...props} />
      <FieldErrors />
    </>
  );
}
