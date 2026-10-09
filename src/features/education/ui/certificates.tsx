// services, features, and other libraries
import { useGT } from "gt-tanstack-start";

// components
import { PanelCaption } from "@/ui/panel-caption";

// assets
import artcom from "@/assets/my-certificates-artcom.webp";
import alcc from "@/assets/my-certificates-alcc.webp";
import prattOrig from "@/assets/my-certificates-pratt-orig.webp";
import prattTrans from "@/assets/my-certificates-pratt-trans.webp";

export function Certificates() {
  const gt = useGT();

  return (
    <figure className="mx-auto w-full max-w-4xl">
      <PanelCaption>{gt("My Certificates")}</PanelCaption>
      <a href="/my-certificates.pdf" target="_blank" rel="noopener noreferrer" className="space-y-4">
        <img src={artcom} width={1222} height={870} alt="ARTCOM" loading="lazy" className="h-auto w-full" />
        <img src={alcc} width={1222} height={870} alt="ALCC" loading="lazy" className="h-auto w-full" />
        <img src={prattOrig} width={1222} height={870} alt="Pratt" loading="lazy" className="h-auto w-full" />
        <img src={prattTrans} width={1694} height={870} alt="Pratt" loading="lazy" className="h-auto w-full" />
      </a>
    </figure>
  );
}
