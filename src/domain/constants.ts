// types
import type { ClassAttributes, DetailedHTMLProps, LinkHTMLAttributes, MetaHTMLAttributes } from "react";

export interface RootHead {
  meta?: (DetailedHTMLProps<MetaHTMLAttributes<HTMLMetaElement>, HTMLMetaElement> | undefined)[];
  links?: ((ClassAttributes<HTMLLinkElement> & LinkHTMLAttributes<HTMLLinkElement>) | undefined)[];
}

// constants
export const TITLE = "Curious Web Dev: Eager to Learn, Collaborate, and Make a Splash";
export const DESCRIPTION =
  "Passionate, self-taught web developer with a strong drive for continuous learning and a proven track record of delivering results. Eager to contribute to impactful projects, collaborate with experienced teams, and build high-quality web applications.";

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const MAX_CHUNK_LENGTH = 80;
export const EXCERPT_SUFFIX = "…";
