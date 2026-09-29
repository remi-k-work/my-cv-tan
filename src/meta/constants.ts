// types
import type { ClassAttributes, DetailedHTMLProps, LinkHTMLAttributes, MetaHTMLAttributes } from "react";

export interface DocumentHead {
  meta?: (DetailedHTMLProps<MetaHTMLAttributes<HTMLMetaElement>, HTMLMetaElement> | undefined)[];
  links?: ((ClassAttributes<HTMLLinkElement> & LinkHTMLAttributes<HTMLLinkElement>) | undefined)[];
  scripts?: ({ type: string; children: string } | undefined)[];
}

// constants
export const SITE_URL = "https://www.remiforge.dev";
export const SITE_NAME = "Remi Forge";

export const TITLE = "Curious Web Dev: Eager to Learn, Collaborate, and Make a Splash";
export const DESCRIPTION =
  "Passionate, self-taught web developer with a strong drive for continuous learning and a proven track record of delivering results. Eager to contribute to impactful projects, collaborate with experienced teams, and build high-quality web applications.";

export const GLOBAL_IMAGE = `${SITE_URL}/opengraph-image.jpg`;
