// react
import { useId } from "react";

// services, features, and other libraries
import { Option } from "effect";
import { FormReact } from "@lucas-barake/effect-form-react";

// components
import { ErrorLine } from "@/ui/form/error-line";

// types
import type { ChangeEvent, ElementType } from "react";

// A shared labeled form field: label, input element, and error line
// Parameterized by the rendered element so text inputs and textareas reuse one structure
// The caller's props type is carried through instead of being cast through an untyped
// record here, so every input keeps its own prop types end to end
interface LabeledFieldProps<P> {
  // The field binding comes from the form library itself rather than a local restatement of it,
  // so a field state the library adds is never silently missing here
  field: FormReact.FieldState<string>;
  props: P & { readonly label: string };
  element: ElementType;
  fieldClassName?: string;
}

// Label + input + error line, shared by TextInput and TextAreaInput; the element and its className are passed in; everything else is identical
export function LabeledField<P extends object>({ field, props, element: Element, fieldClassName }: LabeledFieldProps<P>) {
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
      <Element
        // The caller's props come first: everything below is the field binding, so a stray
        // `value` or `onChange` in the caller's props can never take the input out of the form
        {...rest}
        className={fieldClassName}
        id={inputId}
        name={path}
        value={value}
        // One component renders both an input and a textarea, so the event is typed for either
        onChange={(ev: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(ev.target.value)}
        onBlur={onBlur}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? errorId : undefined}
      />
      <ErrorLine id={errorId} error={error} />
    </>
  );
}
