// The JSON-LD feature's contracts: the serialized script element every head publishes, and the open
// node shapes the graph builders emit; nodes are deliberately open records so builders can add
// schema.org fields without a central struct enumerating every property

export interface JsonLdScript {
  readonly type: "application/ld+json";
  readonly children: string;
}

type JsonLdValue = string | number | boolean | null | JsonLdObject | ReadonlyArray<JsonLdValue>;

export interface JsonLdObject {
  readonly [property: string]: JsonLdValue | undefined;
}

export interface JsonLdNode extends JsonLdObject {
  readonly "@type"?: string;
  readonly "@id"?: string;
}

export type JsonLdNodes = ReadonlyArray<JsonLdNode>;
