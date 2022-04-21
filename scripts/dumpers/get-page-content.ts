import axios from "axios";
import { writeFileSync } from "fs";
import { WikiPageTitle } from "./page-list";
import { WikiPageWithContent } from "../wiki/request";


interface WikiPageResponse {
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

// Will download all of the wiki pages from the list
export async function DumpAllWikiPages() {

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
    const result = response.data.parse as WikiPageResponse;

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
      `${__dirname}/../pages/content/${newPage.pageid}.json`,
      JSON.stringify(newPage)
    );
  }
}
