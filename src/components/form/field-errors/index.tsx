// other libraries
import { useFieldContext } from "@/components/form";
import useAnimatedErrors from "@/hooks/useAnimatedErrors";

// components
import { ErrorLine } from "./ErrorLine";

// types
import type { ZodError } from "zod";

export default function FieldErrors() {
  // Get the field context
  const {
    state: {
      value,
      meta: { errors, isTouched },
    },
  } = useFieldContext();

  // Live error messages (unique strings)
  const liveErrorMessages = [...new Set(errors.map(({ message }: ZodError) => message))];

  // Only render errors once the field has been touched and is no longer pristine
  const animatedErrors = useAnimatedErrors(liveErrorMessages, { gated: true, show: isTouched });

  if (value === undefined) return <div className="min-h-14" />;
  return (
    <div className="min-h-14">
      {animatedErrors.map(({ message, isShowing }) => (
        <ErrorLine key={message} isShowing={isShowing} message={message} />
      ))}
    </div>
  );
}
