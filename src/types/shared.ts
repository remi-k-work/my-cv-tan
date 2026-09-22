export interface Experience {
  year: string;
  role: string;
  company: string;
  txt: string;
  gitHubLink?: string;
  liveLink?: string;
  imageName: string;
  skillsUsed: string[];
  videoLink?: string;
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
