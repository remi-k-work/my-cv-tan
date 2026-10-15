// react
import { useId } from "react";

// services, features, and other libraries
import { Option } from "effect";
import { FormReact } from "@lucas-barake/effect-form-react";

// components
import { Input } from "@base-ui/react";
import { ErrorLine } from "@/ui/form";

// types
import type { ComponentPropsWithoutRef } from "react";

interface TextInputProps extends ComponentPropsWithoutRef<typeof Input> {
  label: string;
}

export const TextInput: FormReact.FieldComponent<string, TextInputProps> = ({ field, props }) => {
  // Get the field context
  const { path, value, onChange, onBlur, error } = field;
  const { label, ...rest } = props;

  // Generate a unique id
  const baseId = useId();
  const inputId = `${baseId}-input`;
  const errorId = `${baseId}-error`;
  const hasError = Option.isSome(error);

  return (
    <>
      <label className="label" htmlFor={inputId}>
        {label}
      </label>
      <Input
        className="input"
        id={inputId}
        name={path}
        value={value}
        onChange={(ev) => onChange(ev.target.value)}
        onBlur={onBlur}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? errorId : undefined}
        {...rest}
      />
      <ErrorLine id={errorId} message={Option.getOrUndefined(error)} />
    </>
  );
};
