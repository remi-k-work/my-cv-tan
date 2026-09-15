// assets
import artcom from "@/assets/my-certificates-artcom.webp";
import alcc from "@/assets/my-certificates-alcc.webp";
import prattOrig from "@/assets/my-certificates-pratt-orig.webp";
import prattTrans from "@/assets/my-certificates-pratt-trans.webp";

// types
import type { LocalizedContent } from "@/types/shared";

interface MyCertificatesProps {
  localizedContent: LocalizedContent;
}

export default function MyCertificates({ localizedContent }: MyCertificatesProps) {
  return (
    <figure className="mx-auto w-full max-w-4xl">
      <figcaption className="mb-4 place-self-end rounded-ss-xl rounded-ee-xl bg-primary-foreground p-3 italic">
        {localizedContent["myCertificates"]["myCertificates"]}
      </figcaption>
      <a href="https://www.remiforge.dev/my-certificates.pdf" target="_blank" rel="noopener noreferrer" className="space-y-4">
        <img src={artcom} width={1222} height={870} alt="ARTCOM" loading="lazy" className="h-auto w-full" />
        <img src={alcc} width={1222} height={870} alt="ALCC" loading="lazy" className="h-auto w-full" />
        <img src={prattOrig} width={1222} height={870} alt="Pratt" loading="lazy" className="h-auto w-full" />
        <img src={prattTrans} width={1694} height={870} alt="Pratt" loading="lazy" className="h-auto w-full" />
      </a>
    </figure>
  );
}
