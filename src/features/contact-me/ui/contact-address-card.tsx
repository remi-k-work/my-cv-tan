// services, features, and other libraries
import { useGT } from "gt-tanstack-start";
import { motion } from "motion/react";
import { useTilt } from "@/features/experience/hooks/use-tilt";

// assets
import avatar from "@/assets/avatar.jpg";

// The floating address card: portrait plus contact details, leaning with pointer tilt
// It owns its own tilt behavior since the card — not the map — is the tilted element
export function ContactAddressCard() {
  const gt = useGT();
  const { style, handlers, glareStyle } = useTilt();

  return (
    <motion.div className="absolute inset-e-4 top-4" style={style} {...handlers}>
      <div className="animate-float rounded-xl bg-surface-1/90 p-3 text-sm select-none [animation-delay:-3.5s]">
        <img src={avatar} width={288} height={288} alt={gt("Portrait of Remi")} className="aspect-square max-h-32 w-full object-cover" loading="lazy" />
        {/* The owner's contact information: exactly what the address element is for */}
        <address className="not-italic">
          <p className="mt-4">Remi</p>
          <p className="text-text-2">Broniewskiego 24</p>
          <p className="text-text-2">35-206 Rzeszów</p>
          <p className="mb-4 text-text-2">{gt("Poland")}</p>
          <a href="mailto:remi.k.work@proton.me" className="underline">
            remi.k.work@proton.me
          </a>
        </address>
      </div>
      <motion.div className="pointer-events-none absolute inset-0 rounded-xl" style={glareStyle} aria-hidden="true" />
    </motion.div>
  );
}
