// The one tile origin the contact map loads from, declared once so the preconnect that warms it
// and the TileLayer that reads it cannot drift apart: the canonical single-host URL, since the
// a/b/c subdomain placeholders are deprecated now that the tile service speaks HTTP/2/3
export const TILE_ORIGIN = "https://tile.openstreetmap.org";
export const TILE_URL = `${TILE_ORIGIN}/{z}/{x}/{y}.png`;
