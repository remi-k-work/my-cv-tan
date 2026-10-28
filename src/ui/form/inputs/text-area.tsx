// services, features, and other libraries
import { FormReact } from "@lucas-barake/effect-form-react";

// components
import { LabeledField } from "./field";

// types
import type { ComponentPropsWithoutRef } from "react";

interface TextAreaInputProps extends ComponentPropsWithoutRef<"textarea"> {
  label: string;
}

// A labeled textarea backed by the form field
export const TextAreaInput: FormReact.FieldComponent<string, TextAreaInputProps> = ({ field, props }) => (
  <LabeledField field={field} props={props} element="textarea" fieldClassName="textarea" />
);
