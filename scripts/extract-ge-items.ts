import { readFileSync, writeFileSync } from "fs";
import itemsR from "../pages/ge-items-list.json";
import { Item } from "../types";
import parseInfo from "infobox-parser";
import { WikiPageWithContent } from "./get-page-content";

interface WikiItem {
  name: string;
  // format: "File:1-3rds full jug.png"
  image: string;
  // format: ['2 November', '2004']
  // release: [string, string];
  // update: string;
  members: "Yes" | "No";
  // quest: string;
  tradeable: "Yes" | "No";
  // placeholder: "Yes" | "No";
  equipable: "Yes" | "No";
  stackable: "Yes" | "No";
  // noteable: "Yes" | "No";
  exchange: "Yes" | "No";
  destroy: string;
  examine: string;
  value: string;
  alchable: "Yes" | "No";
  weight: string;
  id: string;
}
const WikiToItemKeys: Record<Partial<keyof WikiItem>, keyof Item> = {
  name: "name",
  image: "image",
  members: "isMembers",
  tradeable: "isTradeable",
  equipable: "isEquipable",
  stackable: "isStackable",
  exchange: "isOnGrandExchange",
  destroy: "drop",
  examine: "examine",
  value: "value",
  alchable: "isAlchable",
  weight: "weight",
  id: "id",
};
const wikiItems: Record<string, number> = itemsR;

// Todo: Use https://oldschool.runescape.wiki/?curid=181035 instead?
export function extractGEItems(): Item[] {
  const candidateItemIds = Object.values(wikiItems);
  const items: Item[] = [];
  for (let i = 0; i < candidateItemIds.length; i++) {
    if (i % 100 === 0) {
      console.info(`Parsing item ${i}/${candidateItemIds.length}`);
    }
    const pageId = candidateItemIds[i];
    let rawWikiPage;
    try {
      rawWikiPage = JSON.parse(
        readFileSync(__dirname + `/../pages/content/${pageId}.json`, "utf8")
      ) as WikiPageWithContent;
    } catch (e) {
      console.warn("Page not downloaded: ", pageId);
      continue;
    }

    if (rawWikiPage.rawContent.includes("{{Deadman seasonal}}")) {
      // Exclude DMM items
      continue;
    }

    const parsed = parseInfo(
      rawWikiPage.rawContent.replace(/\{\|/g, "{a|")
    ).general;

    const hasMultiple = Object.keys(parsed).some((v) => v.endsWith("2"));

    if (parsed?.exchange !== "Yes" && !hasMultiple) {
      if (!rawWikiPage.pagename.startsWith("Sigil")) {
        console.warn(
          "Item is not on the GE!",
          rawWikiPage.title,
          rawWikiPage.pageid
        );
      }
      // Skip non-ge items
      continue;
    }
    // Skip gone items and redundant jmod items
    if ("removal" in parsed || rawWikiPage.title.includes("Redundant")) {
      continue;
    }

    const baseItem: Item = {
      id: Number(parsed.id),
      name: parsed.name,
      examine: parsed.examine,
      image: parsed.image,
      isEquipable: parsed.equipable === "Yes",
      isAlchable: parsed.alchable === "Yes",
      isOnGrandExchange: parsed.exchange === "Yes",
      isTradeable: parsed.tradeable === "Yes",
      isMembers: parsed.members === "Yes",
      isStackable: parsed.stackable === "Yes",
      drop: parsed.destroy,
      options: [],
      relatedItems: [],
      value: Number(parsed.value),
      weight: Number(parsed.weight),
    };

    if (hasMultiple) {
      const allVariants: Item[] = [];
      Object.keys(parsed).forEach((key: string) => {
        const candidateKey = key.match(/\d+$/);
        // @ts-ignore
        const endIndex = candidateKey ? Number(candidateKey[0]) : 0;
        const baseKey = key.replace(/\d+$/, "");
        if (key === baseKey || endIndex === 0) {
          return;
        }

        if (!allVariants[endIndex]) {
          allVariants[endIndex] = { ...baseItem };
        }

        let value;
        switch (baseKey as keyof WikiItem) {
          case "id":
          case "value":
          case "weight":
            value = Number(parsed[key]);
            break;
          case "name":
          case "examine":
          case "destroy":
            value = parsed[key];
            break;
          case "equipable":
          case "alchable":
          case "exchange":
          case "tradeable":
          case "stackable":
            value = parsed[key] === "Yes";
            break;
          default:
            break;
        }
        if (value) {
          // @ts-ignore
          allVariants[endIndex][WikiToItemKeys[baseKey]] = value;
        }
      });

      const geVariants = allVariants.filter(
        (v) => v.isOnGrandExchange && v.isTradeable
      );
      const oddities = allVariants.filter(
        (v) => !v.isTradeable && v.isOnGrandExchange
      );
      if (oddities.length) {
        console.warn(
          `Oddity found: ${oddities[0].name} is not tradeable, but on the GE!\n` +
            `https://oldschool.runescape.wiki/?curid=${rawWikiPage.pageid}`
        );
      }
      if (geVariants.length === 0) {
        console.info(
          `Item ${rawWikiPage.title} has ${allVariants.length} variants, of which ${geVariants.length} are on the GE`
        );
      }

      const geIds = geVariants.map((v) => v.id);
      geVariants.forEach(
        (v) => (v.relatedItems = geIds.filter((id) => v.id !== id))
      );

      items.push(...geVariants);
    } else {
      items.push(baseItem);
    }
  }

  writeFileSync(
    __dirname + `/../pages/ge-items.json`,
    JSON.stringify(items, null, 2)
  );
  console.log(`Finished writing ${items.length} items.`);
  return items;
}
