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
  release: [string, string];
  update: string;
  members: "Yes" | "No";
  quest: string;
  tradeable: "Yes" | "No";
  placeholder: "Yes" | "No";
  equipable: "Yes" | "No";
  stackable: "Yes" | "No";
  noteable: "Yes" | "No";
  exchange: "Yes" | "No";
  destroy: string;
  examine: string;
  value: string;
  alchable: "Yes" | "No";
  weight: string;
  id: string;
}

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

    const parsed = parseInfo(rawWikiPage.rawContent.replace(/\{\|/g, "{a|"))
      .general as WikiItem;

    if (parsed?.exchange !== "Yes") {
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

    const item: Item = {
      id: Number(parsed.id),
      name: parsed.name,
      examine: parsed.examine,
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
    items.push(item);
  }

  writeFileSync(
    __dirname + `/../pages/ge-items.json`,
    JSON.stringify(items, null, 2)
  );
  console.log(
    `Finished writing ${items.length} items. ${candidateItemIds.length - items.length} could not be parsed.`
  );
  return items;
}
