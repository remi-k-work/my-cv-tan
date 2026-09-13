// other libraries
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";

// components
import TextField from "./fields/Text";
import TextAreaField from "./fields/TextArea";
import CheckBoxField from "./fields/CheckBox";
import SelectField from "./fields/Select";
import FormSubmit from "./FormSubmit";

export const { fieldContext, useFieldContext, formContext, useFormContext } = createFormHookContexts();

export const { useAppForm } = createFormHook({
  fieldComponents: { TextField, TextAreaField, CheckBoxField, SelectField },
  formComponents: { FormSubmit },
  fieldContext,
  formContext,
});
