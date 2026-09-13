// react
import { useId } from "react";

// other libraries
import { useFieldContext } from "@/components/form";

// components
import { Label } from "@/components/ui/custom/label";
import { Checkbox } from "@/components/ui/checkbox";
import FieldErrors from "@/components/form/field-errors";

// types
import type { ComponentPropsWithoutRef } from "react";

interface CheckBoxFieldProps extends ComponentPropsWithoutRef<typeof Checkbox> {
  label: string;
}

export default function CheckBoxField({ label, ...props }: CheckBoxFieldProps) {
  // Get the field context
  const {
    name,
    state: { value },
    handleChange,
    handleBlur,
  } = useFieldContext<boolean>();

  // Generate a unique id
  const id = useId();

  return (
    <>
      <div className="flex items-center gap-1">
        <Checkbox
          id={id}
          name={name}
          checked={!!value}
          value="true"
          onCheckedChange={(checked) => handleChange(checked === true)}
          onBlur={handleBlur}
          {...props}
        />
        <Label htmlFor={id}>{label}</Label>
      </div>
      <FieldErrors />
    </>
  );
}
