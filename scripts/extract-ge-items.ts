import { readFileSync, writeFileSync } from "fs";
import itemsR from "../pages/ge-items-list.json";
import { Item } from "../types";
import parseInfo from "infobox-parser";
import { WikiPageWithContent } from "./get-page-content";

const GEItemsPath = __dirname + `/../pages/ge-items.json`;
interface WikiItem {
  gemwname?: string;
  name: string;
  // format: "File:1-3rds full jug.png"
  image: string;
  // format: ['2 November', '2004']
  // release: [string, string];
  // update: string;
  members: "Yes" | "No" | boolean;
  // quest: string;
  tradeable: "Yes" | "No" | boolean;
  // placeholder: "Yes" | "No" | boolean;
  equipable: "Yes" | "No" | boolean;
  stackable: "Yes" | "No" | boolean;
  // noteable: "Yes" | "No" | boolean;
  exchange: "Yes" | "No" | boolean;
  destroy: string;
  examine: string;
  value: string;
  alchable: "Yes" | "No" | boolean;
  weight: string;
  id: string;
}
const WikiToItemKeys: Record<Partial<keyof WikiItem>, keyof Item> = {
  gemwname: "name",
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

    const parsed: WikiItem = parseInfo(
      rawWikiPage.rawContent.replace(/\{\|/g, "{a|").replace(/\{\{sic\}\}/g, '')
    ).general;

    const hasMultiple = Object.keys(parsed).some((v) => v.endsWith("2"));

    if (
      parsed?.exchange !== "Yes" &&
      parsed?.exchange !== true &&
      !hasMultiple
    ) {
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
      name: parsed.gemwname || parsed.name,
      examine: parsed.examine,
      image: parsed.image,
      isEquipable: parsed.equipable === "Yes" || parsed.equipable === true,
      isAlchable: parsed.alchable === "Yes" || parsed.alchable === true,
      isOnGrandExchange: parsed.exchange === "Yes" || parsed.exchange === true,
      isTradeable: parsed.tradeable === "Yes" || parsed.tradeable === true,
      isMembers: parsed.members === "Yes" || parsed.members === true,
      isStackable: parsed.stackable === "Yes" || parsed.stackable === true,
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
            value = Number((parsed as any)[key]);
            break;
          case "name":
          case "gemwname":
          case "examine":
          case "destroy":
            value = (parsed as any)[key];
            break;
          case "equipable":
          case "alchable":
          case "exchange":
          case "tradeable":
          case "stackable":
          case "members":
            value = (parsed as any)[key] === "Yes" || (parsed as any)[key] === true;
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

  writeFileSync(GEItemsPath, JSON.stringify(items, null, 2));
  console.log(`Finished writing ${items.length} items.`);
  return items;
}

interface MappingItem {
  examine: string;
  id: number;
  members: boolean;
  lowalch: number;
  limit: number;
  value: number;
  highalch: number;
  icon: string;
  name: string;
}

export function testGeItems() {
  const ourItems: Item[] = JSON.parse(readFileSync(GEItemsPath, "utf8"));
  const wikiItems: MappingItem[] = JSON.parse(
    readFileSync(__dirname + "/../pages/mapping.json", "utf8")
  );

  for (let i = 0; i < wikiItems.length; i++) {
    const wikiItem = wikiItems[i];
    const ourItem = ourItems.find((item) => item.id === wikiItem.id);

    if (!ourItem) {
      console.error("Wiki has an extra item!", wikiItem.id, wikiItem.name);
      continue;
    }

    if (wikiItem.name !== ourItem.name) {
      console.warn(
        `item ${wikiItem.id} has a different name: ${wikiItem.name} vs ${ourItem.name}`
      );
    }

    if (wikiItem.examine !== ourItem.examine) {
      // Mapping is frequently outdated on examine
      console.warn(
        `item ${wikiItem.id} has a different examine: ${wikiItem.examine} vs ${ourItem.examine}`
      );
    }
    if (wikiItem.value !== ourItem.value && wikiItem.value !== 0 && wikiItem.value !== 1) {
      console.warn(
        `item ${wikiItem.id} has a different value: ${wikiItem.value} vs ${ourItem.value}`
      );
    }
    if (wikiItem.members !== ourItem.isMembers) {
      console.warn(
        `item ${wikiItem.id} has a different membership: ${wikiItem.members} vs ${ourItem.isMembers}`
      );
    }
  }
}
