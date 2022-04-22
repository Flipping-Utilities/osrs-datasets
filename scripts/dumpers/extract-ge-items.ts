import axios from "axios";
import { readFileSync, writeFileSync } from "fs";
import parseInfo from "infobox-parser";
import GEItemPageList from "../../data/items/ge-item-page-list";
import GEItems from "../../data/items/ge-items";
import { GE_ITEMS, WIKI_PAGES_FOLDER } from "../paths";
import { Item } from "../types";
import { WikiPageWithContent } from "../wiki/request";

const GELimitsModuleUrl =
  "https://oldschool.runescape.wiki/w/Module:GELimits/data?action=raw";
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

export async function fetchGEItems(): Promise<Item[]> {
  const GELimitsRawText = (await axios.get(GELimitsModuleUrl)).data;
  const json = GELimitsRawText.replace("return ", "")
    .replace(/[[|\]]/g, "")
    .replace(/=/g, ":");
  const GELimitsRecord: Record<string, number> = JSON.parse(json);

  const items: Item[] = [];
  for (let i = 0; i < GEItemPageList.length; i++) {
    if (i % 100 === 0) {
      console.info(`Parsing item ${i}/${GEItemPageList.length}`);
    }
    const page = GEItemPageList[i];
    let rawWikiPage;
    try {
      rawWikiPage = JSON.parse(
        readFileSync(`${WIKI_PAGES_FOLDER}/${page.pageid}.json`, "utf8")
      ) as WikiPageWithContent;
    } catch (e) {
      console.warn(`Page not downloaded: (${page.pageid}) ${page.title}`);
      continue;
    }

    if (rawWikiPage.rawContent.includes("{{Deadman seasonal}}")) {
      // Exclude DMM items
      continue;
    }

    const parsed: WikiItem = parseInfo(
      rawWikiPage.rawContent.replace(/\{\|/g, "{a|").replace(/\{\{sic\}\}/g, "")
    ).general;

    const hasMultiple = Object.keys(parsed).some((v) => v.endsWith("2"));

    if (
      parsed?.exchange !== "Yes" &&
      parsed?.exchange !== true &&
      !hasMultiple
    ) {
      // Sigils were used in seasonal game modes: Ignore them
      if (!rawWikiPage.pagename.startsWith("Sigil")) {
        console.warn(
          "Item is not on the GE!",
          rawWikiPage.title,
          rawWikiPage.pageid
        );
      }
      // Skip items that are not on the GE
      continue;
    }
    // Skip removed items and jmod items
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
      limit: GELimitsRecord[parsed.gemwname || parsed.name] || 0,
    };

    if (hasMultiple) {
      const allVariants: Item[] = [];
      Object.keys(parsed).forEach((key: string) => {
        const candidateKey = key.match(/\d+$/);
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
            value =
              (parsed as any)[key] === "Yes" || (parsed as any)[key] === true;
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
        // These are usually incorrect on the wiki: Warn so we can fix them
        console.warn(
          `Oddity found: ${oddities[0].name} is not tradeable, but on the GE!\n` +
            `https://oldschool.runescape.wiki/?curid=${rawWikiPage.pageid}`
        );
      }

      const geIds = geVariants.map((v) => v.id);
      geVariants.forEach((v) => {
        v.relatedItems = geIds.filter((id) => v.id !== id);
        v.limit = v.limit || GELimitsRecord[v.name] || 0;
      });

      items.push(...geVariants);
    } else {
      items.push(baseItem);
    }
  }

  console.info(`Finished fetching ${items.length} items.`);
  return items;
}

/**
 * Will persist the GE items to a file.
 */
export async function dumpGEItems() {
  const items = await fetchGEItems();
  writeFileSync(GE_ITEMS, JSON.stringify(items, null, 2));
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

/**
 * Will compare our generated item list with the mapping from prices.runescape.wiki
 */
export async function TestGeItems() {
  const mappingRequest = await axios.get<MappingItem[]>(
    "https://prices.runescape.wiki/api/v1/osrs/mapping",
    {
      headers: {
        "User-Agent":
          "FU Dataset script - Test GE Items - " +
            process.env.DISCORD_IDENTIFIER || "Missing discord id >:(",
      },
    }
  );
  const wikiItems = mappingRequest.data;
  for (let i = 0; i < wikiItems.length; i++) {
    const wikiItem = wikiItems[i];
    const ourItem = GEItems.find((item) => item.id === wikiItem.id);

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
    if (
      wikiItem.value !== ourItem.value &&
      wikiItem.value !== 0 &&
      wikiItem.value !== 1
    ) {
      console.warn(
        `item ${wikiItem.id} has a different value: ${wikiItem.value} vs ${ourItem.value}`
      );
    }
    if (wikiItem.members !== ourItem.isMembers) {
      console.warn(
        `item ${wikiItem.id} has a different membership: ${wikiItem.members} vs ${ourItem.isMembers}`
      );
    }
    if (wikiItem.limit !== ourItem.limit && (wikiItem.limit || ourItem.limit)) {
      console.warn(
        `item ${wikiItem.id} has a different limit: ${wikiItem.limit} vs ${ourItem.limit}`
      );
    }
  }
}
