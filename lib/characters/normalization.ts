export const normalizeLookup = (value: string) => value.trim().toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const normalizeCharacterName = (value: string) => value.trim().normalize("NFC").toLocaleLowerCase("en-US");
