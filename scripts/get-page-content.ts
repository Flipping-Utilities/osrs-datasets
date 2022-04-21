import axios from "axios";
import { writeFileSync } from "fs";
import { WikiPageTitle } from "./get-pages";

import pages from "../pages/list.json";

export interface WikiPageWithContent {
  pagename: string;
  title: string;
  pageid: number;
  revid: number;
  content: string;
  rawContent: string;
  displaytitle: string;
  properties: { name: string; value: string }[];
}

interface WikiResponse {
  title: number;
  revid: number;
  displaytitle: string;
  text: {
    "*": string;
  };
  wikitext: {
    "*": string;
  };
  properties: { name: string; "*": string }[];
}

export async function dumpAllWikiPages(): Promise<void> {
  const now = Date.now();
  for (let i = 0; i < pages.length; i++) {
    if (i % 10 === 0) {
      console.info(
        `Request ${i} / ${pages.length} - ${
          Math.round(now - Date.now()) / 1000
        } s elapsed`
      );
    }

    const currentPage = pages[i] as WikiPageTitle;
    const response = await axios.get(
      `https://oldschool.runescape.wiki/api.php?action=parse&pageid=${currentPage.pageid}&format=json&prop=properties|wikitext|displaytitle|subtitle|revid|text`,
      {
        headers: {
          "User-Agent": "Anyny0#4452 - Dumping the wiki",
        },
      }
    );
    const result = response.data.parse as WikiResponse;

    const newPage: WikiPageWithContent = {
      pageid: currentPage.pageid,
      pagename: currentPage.title,
      title: result.displaytitle,
      displaytitle: result.displaytitle,
      revid: result.revid,
      properties: result.properties.map((p) => ({
        name: p.name,
        value: p["*"],
      })),
      content: result.text["*"],
      rawContent: result.wikitext["*"],
    };

    writeFileSync(
      `${__dirname}/pages/content/${newPage.pageid}.json`,
      JSON.stringify(newPage)
    );
  }
}