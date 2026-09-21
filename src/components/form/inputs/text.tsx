// react
import { useId } from "react";

// services, features, and other libraries
import { Hash, Option, pipe } from "effect";
import { FormReact } from "@lucas-barake/effect-form-react";
import { AnimatePresence } from "motion/react";

// components
import { Input } from "@base-ui/react";
import { ErrorLine } from "@/components/form";

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
      <div className="min-h-6">
        <AnimatePresence>{Option.isSome(error) && <ErrorLine message={error.value} />}</AnimatePresence>
      </div>
    </>
  );
};

export function TextInputSkeleton({ formName = "global", label, ...rest }: TextInputProps & { formName?: string }) {
  // Generate a hash id from the incoming form name and label
  const id = pipe(`${formName}::${label}`, Hash.string, Math.abs, (hashValue) => `input-${hashValue}`);

  return (
    <>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <Input className="input" id={id} name={label} disabled {...rest} />
      <div className="min-h-6" />
    </>
  );
}
