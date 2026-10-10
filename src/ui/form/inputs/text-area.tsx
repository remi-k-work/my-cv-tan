// react
import { useId } from "react";

// services, features, and other libraries
import { Option } from "effect";
import { FormReact } from "@lucas-barake/effect-form-react";

// components
import { ErrorLine } from "@/ui/form";

// types
import type { ComponentPropsWithoutRef } from "react";

interface TextAreaInputProps extends ComponentPropsWithoutRef<"textarea"> {
  label?: string;
}

export const TextAreaInput: FormReact.FieldComponent<string, TextAreaInputProps> = ({ field, props }) => {
  // Get the field context
  const { path, value, onChange, onBlur, error } = field;
  const { label, ...rest } = props;

  // Generate a unique id
  const id = useId();

  return (
    <>
      {label && (
        <label className="label" htmlFor={id}>
          {label}
        </label>
      )}
      <textarea className="textarea" id={id} name={path} value={value} onChange={(ev) => onChange(ev.target.value)} onBlur={onBlur} {...rest} />
      <ErrorLine message={Option.getOrUndefined(error)} />
    </>
  );
};
