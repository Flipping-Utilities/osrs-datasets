import { readFileSync, writeFileSync } from "fs";
import AllSetsPageList from "../../data/items/all-sets-page-list";
import GEItems from "../../data/items/ge-items";
import { ALL_SETS, WIKI_PAGES_FOLDER } from "../paths";
import { WikiPageWithContent } from "../wiki/request";

const GEItemNameRecord: Record<string, number> = GEItems.reduce(
  (acc: Record<string, number>, item) => {
    acc[item.name] = item.id;
    return acc;
  },
  {}
);

import { Set } from "../types";

export function extractAllSets(): Set[] {
  const sets: Set[] = [];
  for (let i = 0; i < AllSetsPageList.length; i++) {
    if (i % 100 === 0) {
      console.info(`Parsing item ${i}/${AllSetsPageList.length}`);
    }
    const page = AllSetsPageList[i];
    let rawWikiPage;
    try {
      rawWikiPage = JSON.parse(
        readFileSync(`${WIKI_PAGES_FOLDER}/${page.pageid}.json`, "utf8")
      ) as WikiPageWithContent;
    } catch (e) {
      console.warn(`Page not downloaded: (${page.pageid}) ${page.title}`);
      continue;
    }

    /*
     * Set format:
     * {{CostTableHead}}
     * {{CostLine|Ancient page 1}}
     * {{CostLine|Ancient page 2}}
     * {{CostLine|Ancient page 3}}
     * {{CostLine|Ancient page 4}}
     * {{CostTableBottom|total=y|compare={{PAGENAME}}}};
     */

    const matcher = /\{\{CostLine\|(.+)\}\}/gm;
    const components = Array.from(rawWikiPage.rawContent.matchAll(matcher));
    if (!components.length) {
      console.log("No components", page.title, page.pageid);
      continue;
    }
    // Blue mystic sets has |disambiguation, strip it
    const componentNames = components.map((c) => c[1].split("|")[0]);
    const componentIds = componentNames.map((name) => GEItemNameRecord[name]);
    const set: Set = {
      id: GEItemNameRecord[page.title],
      name: page.title,
      componentIds,
    };
    if (!set.id) {
      console.warn(`No set id!`, page.title);
    }
    if (!componentIds.every((c) => c)) {
      console.log(`Missing a component id: ${componentNames} ${componentIds}`);
    }
    sets.push(set);
  }
  return sets;
}

export function dumpAllSets() {
  const sets = extractAllSets();
  writeFileSync(ALL_SETS, JSON.stringify(sets, null, 2));
}
