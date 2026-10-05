// types
import type { ClassAttributes, DetailedHTMLProps, LinkHTMLAttributes, MetaHTMLAttributes } from "react";

export interface DocumentHead {
  meta?: (DetailedHTMLProps<MetaHTMLAttributes<HTMLMetaElement>, HTMLMetaElement> | undefined)[];
  links?: ((ClassAttributes<HTMLLinkElement> & LinkHTMLAttributes<HTMLLinkElement>) | undefined)[];
  scripts?: ({ type: string; children: string } | undefined)[];
}

export interface SocialImage {
  readonly src: string;
  readonly mime: "image/jpeg" | "image/webp";
  readonly width?: number;
  readonly height?: number;
}

export interface SocialMetaInput {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly image: SocialImage;
  readonly ogType: "website" | "article";
  readonly twitterImage?: SocialImage;
}
