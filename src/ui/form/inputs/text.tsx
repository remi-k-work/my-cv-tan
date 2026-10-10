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
  const id = useId();

  return (
    <>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <Input className="input" id={id} name={path} value={value} onChange={(ev) => onChange(ev.target.value)} onBlur={onBlur} {...rest} />
      <ErrorLine message={Option.getOrUndefined(error)} />
    </>
  );
};
