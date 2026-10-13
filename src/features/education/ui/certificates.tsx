// services, features, and other libraries
import { useGT } from "gt-tanstack-start";

// components
import { PanelCaption } from "@/ui/panel-caption";

// assets
import artcom from "@/assets/my-certificates-artcom.webp";
import alcc from "@/assets/my-certificates-alcc.webp";
import prattOrig from "@/assets/my-certificates-pratt-orig.webp";
import prattTrans from "@/assets/my-certificates-pratt-trans.webp";

// constants
const CERTIFICATE_CLASSES = "h-auto w-full transition-transform duration-500 hover:[transform:rotateX(3deg)_rotateY(-3deg)_scale(1.02)]";

export function Certificates() {
  const gt = useGT();

  return (
    <figure className="mx-auto w-full max-w-4xl">
      <PanelCaption>{gt("My Certificates")}</PanelCaption>
      <a href="/my-certificates.pdf" target="_blank" rel="noopener noreferrer" className="space-y-4 perspective-distant">
        <img src={artcom} width={1222} height={870} alt="ARTCOM" loading="lazy" className={CERTIFICATE_CLASSES} />
        <img src={alcc} width={1222} height={870} alt="ALCC" loading="lazy" className={CERTIFICATE_CLASSES} />
        <img src={prattOrig} width={1222} height={870} alt="Pratt" loading="lazy" className={CERTIFICATE_CLASSES} />
        <img src={prattTrans} width={1694} height={870} alt="Pratt" loading="lazy" className={CERTIFICATE_CLASSES} />
      </a>
    </figure>
  );
}
