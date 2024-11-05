import type { ItemData, CategorySection } from "./types";

const SAMPLE_TRAITS = [
    "magical", "rare", "cursed", "blessed", "martial", "finesse", "agile", 
    "deadly", "forceful", "reach", "thrown", "versatile", "backswing", "fatal"
] as const;

const SAMPLE_REQUIREMENTS = [
    "Strength 14", "Dexterity 16", "Intelligence 12", "Level 5", 
    "Expert in Arcana", "Master in Crafting", "Legendary in Athletics"
] as const;

const generateDescription = (id: number): string => {
    const attributes = [
        "[Strength]",
        "[Dexterity]",
        "[Constitution]",
        "[Intelligence]",
        "[Wisdom]",
        "[Charisma]"
    ] as const;
    
    const actions = [
        "{Magic Weapon}",
        "{Shield Block}",
        "{Quick Draw}",
        "{Power Attack}",
        "{Sudden Charge}"
    ] as const;

    // Ensure safe array access with modulo
    const safeIndex = (index: number, array: readonly any[]): number => 
        ((index % array.length) + array.length) % array.length;

    // Create template with guaranteed valid indices
    const template = `A powerful item that enhances your ${
        attributes[safeIndex(id, attributes)]
    } and ${
        attributes[safeIndex(id + 1, attributes)]
    }. Can be used with ${
        actions[safeIndex(id, actions)]
    }.`;

    return template;
};

const generateItem = (id: number): ItemData => ({
    id: crypto.randomUUID(),
    name: `Sample Item ${id}`,
    type: ["weapon", "armor", "spell", "feat", "item"][
        id % 5
    ] as ItemData["type"],
    level: Math.floor(Math.random() * 20) + 1,
    rarity: ["common", "uncommon", "rare", "unique"][
        id % 4
    ] as ItemData["rarity"],
    traits: Array.from(
        { length: Math.floor(Math.random() * 4) + 1 },
        () => SAMPLE_TRAITS[Math.floor(Math.random() * SAMPLE_TRAITS.length)]!
    ).filter((trait): trait is typeof SAMPLE_TRAITS[number] => Boolean(trait)),
    description: generateDescription(id),
    markdown: `
# Sample Item ${id}

This item showcases markdown rendering performance with various elements:

## Properties
- Level ${Math.floor(Math.random() * 20) + 1}
- ${["Weapon", "Armor", "Spell", "Feat", "Item"][id % 5]}

## Description
${generateDescription(id)}

### Requirements
${Array.from(
    { length: Math.floor(Math.random() * 3) + 1 },
    (_, i) => `- ${SAMPLE_REQUIREMENTS[i % SAMPLE_REQUIREMENTS.length]}`
).join('\n')}

### Effects
1. First effect description
2. Second effect description
3. Third effect description

> Special Note: This item has unique properties that make it particularly interesting.
    `,
    price: `${Math.floor(Math.random() * 1000) + 100} gp`,
    requirements: Array.from(
        { length: Math.floor(Math.random() * 3) + 1 },
        (_, i) => SAMPLE_REQUIREMENTS[i % SAMPLE_REQUIREMENTS.length]
    ).filter((req): req is typeof SAMPLE_REQUIREMENTS[number] => Boolean(req)),
    actions: [1, 2, 3, "reaction", "free"][id % 5] as ItemData["actions"],
    relatedItems: Array.from(
        { length: Math.floor(Math.random() * 3) + 1 },
        () => crypto.randomUUID()
    ),
});

const CATEGORIES = ["Weapons", "Armor", "Spells", "Feats", "Items"] as const;

export const generateSampleData = (itemsPerCategory: number = 20): CategorySection[] =>
    CATEGORIES.map(title => ({
        id: crypto.randomUUID(),
        title,
        items: Array.from(
            { length: itemsPerCategory }, 
            (_, i) => generateItem(i)
        ),
        isExpanded: false,
    }));