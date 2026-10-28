// services, features, and other libraries
import { FormReact } from "@lucas-barake/effect-form-react";

// components
import { Input } from "@base-ui/react";
import { LabeledField } from "./field";

// types
import type { ComponentPropsWithoutRef } from "react";

interface TextInputProps extends ComponentPropsWithoutRef<typeof Input> {
  label: string;
}

// A labeled text input backed by the form field
export const TextInput: FormReact.FieldComponent<string, TextInputProps> = ({ field, props }) => (
  <LabeledField field={field} props={props} element={Input} fieldClassName="input" />
);
