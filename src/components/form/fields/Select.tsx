// react
import { useId } from "react";

// other libraries
import { useFieldContext } from "@/components/form";

// components
import { Label } from "@/components/ui/custom/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FieldErrors from "@/components/form/field-errors";

// types
import type { ComponentPropsWithoutRef } from "react";
import type { Updater } from "@tanstack/react-form";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps extends ComponentPropsWithoutRef<typeof Select> {
  label: string;
  options: SelectOption[];
  placeholder?: string;
}

export default function SelectField({ label, options, placeholder, ...props }: SelectFieldProps) {
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
      <Label htmlFor={id}>{label}</Label>
      <Select name={name} value={value ?? ""} onValueChange={(value: Updater<string>) => handleChange(value)} {...props}>
        <SelectTrigger id={id} onBlur={handleBlur}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(({ value, label }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldErrors />
    </>
  );
}
