// react
import { useId } from "react";

// services, features, and other libraries
import { Option } from "effect";

// components
import { ErrorLine } from "@/ui/form/error-line";

// types
import type { ChangeEvent, ElementType } from "react";

// A shared labeled form field: label, input element, and error line
// Parameterized by the rendered element so text inputs and textareas reuse one structure
interface LabeledFieldProps {
  field: { path: string; value: string; onChange: (value: string) => void; onBlur: () => void; error: Option.Option<string> };
  props: unknown;
  element: ElementType;
  fieldClassName?: string;
}

// Label + input + error line, shared by TextInput and TextAreaInput; the element and its className are passed in; everything else is identical
export function LabeledField({ field, props, element: Element, fieldClassName }: LabeledFieldProps) {
  // Get the field context
  const { path, value, onChange, onBlur, error } = field;
  const { label, ...rest } = props as { label: string; [key: string]: unknown };

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
      <Element
        className={fieldClassName}
        id={inputId}
        name={path}
        value={value}
        onChange={(ev: ChangeEvent<HTMLInputElement>) => onChange(ev.target.value)}
        onBlur={onBlur}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? errorId : undefined}
        {...rest}
      />
      <ErrorLine id={errorId} message={Option.getOrUndefined(error)} />
    </>
  );
}
