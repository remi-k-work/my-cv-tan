// Shared feedback messages for contact-form submission, used both by the inline
// status line (SubmitStatus) and the toast notification (useSubmitToast); keeping
// them in one place prevents the two UI layers from drifting out of sync
export function makeSubmitFeedbackMessages(gt: (message: string) => string) {
  return {
    SUCCESS_TITLE: gt("Success!"),
    SUCCESS_DESCRIPTION: gt("Your message has been sent."),
    MISSING_FIELDS_TITLE: gt("Missing fields!"),
    MISSING_FIELDS_DESCRIPTION: gt("Please correct the contact form fields and try again."),
    SERVER_ERROR_TITLE: gt("Server error!"),
    SERVER_ERROR_DESCRIPTION: gt("The message was not sent successfully; please try again later."),
  } as const;
}
