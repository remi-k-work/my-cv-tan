// assets
import { AcademicCapIcon, DocumentTextIcon, HomeIcon, PhoneIcon, VideoCameraIcon } from "@heroicons/react/24/solid";
import LinkedInIcon from "@/assets/icons/LinkedIn";
import GitHubIcon from "@/assets/icons/GitHub";

// types
import type { LocalizedContent } from "@/types/shared";

// constants
export const NAV_ITEMS = (localizedContent: LocalizedContent) => [
  {
    href: "/",
    title: localizedContent["header"]["home"],
    icon: <HomeIcon />,
  },
  {
    href: "/education",
    title: localizedContent["header"]["education"],
    icon: <AcademicCapIcon />,
  },
  {
    href: "/contact",
    title: localizedContent["header"]["contact"],
    icon: <PhoneIcon />,
  },
  {
    href: localizedContent["header"]["hrefPdf"],
    title: localizedContent["header"]["pdf"],
    icon: <DocumentTextIcon />,
    isExternal: true,
  },
  {
    href: "https://fyxk1xpcf8.ufs.sh/f/l5x42vpjizuQBzebVYT4mCZanFKgWlzyG7xJr0c1IRhfEH6T",
    title: localizedContent["header"]["video"],
    icon: <VideoCameraIcon />,
    isExternal: true,
  },
  {
    href: "https://linkedin.com/in/remi-k-work",
    title: "LinkedIn",
    icon: <LinkedInIcon />,
    isExternal: true,
  },
  {
    href: "https://github.com/remi-k-work",
    title: "GitHub",
    icon: <GitHubIcon />,
    isExternal: true,
  },
];
