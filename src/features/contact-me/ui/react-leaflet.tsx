// component css styles
import "leaflet/dist/leaflet.css";

// services, features, and other libraries
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useGT } from "gt-tanstack-start";

// constants
import { UI_COPY } from "@/features/data/domain/ui-copy";

export default function ReactLeaflet() {
  const gt = useGT();

  return (
    <MapContainer center={[50.05142444038861, 21.98322537033913]} zoom={17} className="z-0 size-full">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[50.05142444038861, 21.98322537033913]}>
        <Popup>
          {gt(UI_COPY.contactMap.letUsTalk)}
          <br />
          {gt(UI_COPY.contactMap.overCup)}
        </Popup>
      </Marker>
    </MapContainer>
  );
}
