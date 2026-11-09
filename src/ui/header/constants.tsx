// assets
import AcademicCapIcon from "@heroicons/react/24/solid/AcademicCapIcon";
import DocumentTextIcon from "@heroicons/react/24/solid/DocumentTextIcon";
import HomeIcon from "@heroicons/react/24/solid/HomeIcon";
import PhoneIcon from "@heroicons/react/24/solid/PhoneIcon";
import VideoCameraIcon from "@heroicons/react/24/solid/VideoCameraIcon";
import { GitHubIcon } from "@/assets/icons/github";
import { LinkedInIcon } from "@/assets/icons/linked-in";

// types
import type { ReactNode } from "react";

// constants
import { SOCIAL_PROFILES } from "@/features/meta/domain/constants";

// Static icons hoisted to module scope so re-rendering the nav reuses the same elements instead of recreating them
const ICON_HOME = <HomeIcon />;
const ICON_EDUCATION = <AcademicCapIcon />;
const ICON_CONTACT = <PhoneIcon />;
const ICON_PDF = <DocumentTextIcon />;
const ICON_VIDEO = <VideoCameraIcon />;
const ICON_LINKEDIN = <LinkedInIcon />;
const ICON_GITHUB = <GitHubIcon />;

// The social links are the same declaration the JSON-LD sameAs, the rel="me" head links and the
// Markdown twins publish, so the nav reads them instead of restating the URLs by hand.
const SOCIAL_ICONS: Record<(typeof SOCIAL_PROFILES)[number]["name"], ReactNode> = {
  LinkedIn: ICON_LINKEDIN,
  GitHub: ICON_GITHUB,
};

export const NAV_ITEMS = (pdfHref: string, translate: (message: string) => string) => [
  {
    href: "/",
    title: translate("Home"),
    icon: ICON_HOME,
  },
  {
    href: "/education",
    title: translate("Education"),
    icon: ICON_EDUCATION,
  },
  {
    href: "/contact",
    title: translate("Contact"),
    icon: ICON_CONTACT,
  },
  {
    href: pdfHref,
    title: translate("PDF Version"),
    icon: ICON_PDF,
    isExternal: true,
  },
  {
    href: "https://fyxk1xpcf8.ufs.sh/f/l5x42vpjizuQBzebVYT4mCZanFKgWlzyG7xJr0c1IRhfEH6T",
    title: translate("Video Version"),
    icon: ICON_VIDEO,
    isExternal: true,
  },
  ...SOCIAL_PROFILES.map(({ name, href }) => ({ href, title: name, icon: SOCIAL_ICONS[name], isExternal: true })),
];
