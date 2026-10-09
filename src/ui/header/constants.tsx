// assets
import { AcademicCapIcon, DocumentTextIcon, HomeIcon, PhoneIcon, VideoCameraIcon } from "@heroicons/react/24/solid";
import { GitHubIcon, LinkedInIcon } from "@/assets/icons";

// types
export const NAV_ITEMS = (pdfHref: string, translate: (message: string) => string) => [
  {
    href: "/",
    title: translate("Home"),
    icon: <HomeIcon />,
  },
  {
    href: "/education",
    title: translate("Education"),
    icon: <AcademicCapIcon />,
  },
  {
    href: "/contact",
    title: translate("Contact"),
    icon: <PhoneIcon />,
  },
  {
    href: pdfHref,
    title: translate("PDF Version"),
    icon: <DocumentTextIcon />,
    isExternal: true,
  },
  {
    href: "https://fyxk1xpcf8.ufs.sh/f/l5x42vpjizuQBzebVYT4mCZanFKgWlzyG7xJr0c1IRhfEH6T",
    title: translate("Video Version"),
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
