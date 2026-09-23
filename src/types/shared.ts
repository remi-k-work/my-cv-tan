export interface Experience {
  type: "e" | "p";
  slug: string;
  year: string;
  role: string;
  company: string;
  txt: string;
  gitHubLink?: string;
  liveLink?: string;
  videoLink?: string;
  imageName: string;
  skillsUsed: string[];
}

export interface Education {
  name: string;
  year: string;
  location: string;
  info: string;
}

export type PageTitles = Record<
  string,
  {
    eyebrow: string;
    heading: string;
    intro: string;
  }
>;

export type LocalizedContent = Record<string, Record<string, string>>;
