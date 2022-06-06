import { readFileSync, writeFileSync } from "fs";
import { JSDOM } from "jsdom";
import AllMonstersPage from "../../data/monsters/all-monsters-page-list";
import { ALL_MONSTERS, ALL_SETS, WIKI_PAGES_FOLDER } from "../paths";
import { WikiPageWithContent } from "../wiki/request";

import { Monster, MonsterDrop } from "../types";

export function extractAllMonsters(): Monster[] {
  const monsters: Monster[] = [];
  for (let i = 0; i < AllMonstersPage.length; i++) {
    if (i % 100 === 0) {
      console.info(`Parsing monster ${i}/${AllMonstersPage.length}`);
    }
    const page = AllMonstersPage[i];
    let rawWikiPage: WikiPageWithContent;
    try {
      rawWikiPage = JSON.parse(
        readFileSync(`${WIKI_PAGES_FOLDER}/${page.pageid}.json`, "utf8")
      ) as WikiPageWithContent;
    } catch (e) {
      console.warn(`Page not downloaded: (${page.pageid}) ${page.title}`);
      continue;
    }

    const html = rawWikiPage.content;
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const allDrops: MonsterDrop[] = [];
    Array.from(document.querySelectorAll(".item-drops")).forEach((table) => {
      const rows = Array.from(table.querySelectorAll("tr")).filter(
        (row) => row.children[0]?.tagName === "TD"
      );
      const sectionDrops: MonsterDrop[] = rows
        .map((row) => {
          const name = row.children[1].textContent?.split("[")[0];
          const quantity = row.children[2].textContent?.split("[")[0];
          const rarity = row.children[3].textContent?.split("[")[0];
          return { name, quantity, rarity };
        })
        .filter((r) => r.name) as MonsterDrop[];
      allDrops.push(...sectionDrops);
    });

    const monster: Monster = {
      name: page.title,
      aliases: rawWikiPage.redirects || [],
      drops: allDrops,
      examine:
        rawWikiPage.properties.find((p) => p.name === "description")?.value ||
        "",
    };

    monsters.push(monster);
  }
  return monsters;
}

export function dumpAllMonsters() {
  const monsters = extractAllMonsters();
  writeFileSync(ALL_MONSTERS, JSON.stringify(monsters, null, 2));
}
