export interface GlossaryEntry {
    term: string;
    description: string;
    relatedTerms?: string[];
    examples?: string[];
}

export const systemGlossary: Record<string, GlossaryEntry> = {
    strength: {
        term: "Strength",
        description: "A measure of physical power. Affects carrying capacity, melee damage, and certain skill checks.",
        relatedTerms: ["Athletics"],
        examples: ["Required for heavy armor", "Used for climbing checks"]
    },
    dexterity: {
        term: "Dexterity",
        description: "Represents agility and reflexes. Affects accuracy, defense, and movement.",
        relatedTerms: ["Acrobatics", "Stealth"],
        examples: ["Used for ranged attacks", "Determines Reflex saves"]
    },
    // Add more terms...
};