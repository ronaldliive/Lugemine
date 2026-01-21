export const sentences = [
    "Ema loeb raamatut.",
    "Isal on uus auto.",
    "Kass magab pehme padja peal.",
    "Koer jookseb aias ringi.",
    "Poiss sööb punast õuna.",
    "Karusell keerleb kiiresti.",
    "Isa parandab vana autot.",
    "Väike kassipoeg mängib lõngakeraga.",
    "Ema küpsetab pühapäeval pannkooke.",
    "Poiss loeb põnevat raamatut.",
    "Tüdruk korjab aias lilli.",
    "Päike paistab helesinises taevas.",
    "Talvel sajab palju lund.",
    "Koolikell heliseb valjusti.",
    "Mulle maitseb külm jäätis.",
    "Vanaema koob sooja salli.",
    "Vanaisa käib metsas seenel.",
    "Lind ehitab puu otsa pesa.",
    "Mõmmi sööb magusat mett.",
    "Jänesel on pikad kõrvad.",
    "Siil kannab seljas õuna.",
    "Orav hüppab oksalt oksale.",
    "Kell seinal näitab aega.",
    "Suur buss sõidab linna.",
    "Rong viib reisijad koju."
];

// Helper to generate pyramid steps from a sentence
export const generatePyramid = (sentence, index) => {
    // Remove punctuation for splitting, but maybe keep it for display?
    // Let's keep it simple: split by spaces.
    const words = sentence.split(' ');
    const steps = [];

    // Generate cumulative steps
    // Step 1: Word1
    // Step 2: Word1 Word2
    // ...
    // Final Step: Sentence

    // Logopeed example: "POISS SÖÖB", "POISS SÖÖB ÕUNA" (Starts with 2 words sometimes?)
    // User request: "esialgi näitab vaid ühte sõna" (Starts with 1 word)

    for (let i = 1; i <= words.length; i++) {
        steps.push(words.slice(0, i).join(' '));
    }

    return {
        id: index + 1,
        title: words[0] + "...", // Title is first word
        fullSentence: sentence,
        steps: steps
    };
};

export const exercises = sentences.map((s, i) => generatePyramid(s, i));
