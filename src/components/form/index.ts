// services, features, and other libraries
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";

// components
import TextField from "./fields/Text";
import TextAreaField from "./fields/TextArea";
import FormSubmit from "./FormSubmit";

export const { fieldContext, useFieldContext, formContext, useFormContext } = createFormHookContexts();

export const { useAppForm } = createFormHook({
  fieldComponents: { TextField, TextAreaField },
  formComponents: { FormSubmit },
  fieldContext,
  formContext,
});
