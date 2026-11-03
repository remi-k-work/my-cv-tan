// Downloadable files advertised by Markdown pages and discovery indexes.

// constants
import { CERTIFICATES_HREF, CV_EN_HREF, CV_PL_HREF } from "@/features/meta/domain/constants";

// Static download assets advertised across twins and machine indexes.
export const DOWNLOADABLE_DOCUMENTS = [
  { label: "CV (English)", href: CV_EN_HREF },
  { label: "CV (Polish)", href: CV_PL_HREF },
  { label: "Certificates", href: CERTIFICATES_HREF },
] as const;
