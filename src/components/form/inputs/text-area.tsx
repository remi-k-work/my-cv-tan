// react
import { useId } from "react";

// services, features, and other libraries
import { Hash, Option, pipe } from "effect";
import { FormReact } from "@lucas-barake/effect-form-react";
import { AnimatePresence } from "motion/react";

// components
import { ErrorLine } from "@/components/form";

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
      <AnimatePresence>{Option.isSome(error) && <ErrorLine message={error.value} />}</AnimatePresence>
    </>
  );
};

export function TextAreaInputSkeleton({ formName = "global", label, ...rest }: TextAreaInputProps & { formName?: string }) {
  // Generate a hash id from the incoming form name and label
  const id = pipe(`${formName}::${label}`, Hash.string, Math.abs, (hashValue) => `input-${hashValue}`);

  return (
    <>
      {label && (
        <label className="label" htmlFor={id}>
          {label}
        </label>
      )}
      <textarea className="textarea" id={id} name={label} disabled {...rest} />
    </>
  );
}
