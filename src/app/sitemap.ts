// types
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.remiforge.dev";
  const eIds = [0, 1, 2, 3, 4, 5, 6, 7] as const;
  const pIds = [0, 1, 2, 3, 4, 5, 6, 7] as const;

  const eUrls = eIds.map((id) => ({ url: `${baseUrl}/exp/e/${id}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 }));
  const pUrls = pIds.map((id) => ({ url: `${baseUrl}/exp/p/${id}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${baseUrl}/education`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/my-cv.pdf`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    ...eUrls,
    ...pUrls,
  ];
}
