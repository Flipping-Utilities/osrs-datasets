import { writeFileSync } from "fs";
import WikiPageList from "../../data/wiki-page-list";
import { WIKI_PAGES_FOLDER } from "../paths";
import {
  WikiPageSlim,
  WikiPageWithContent,
  WikiRequest,
} from "../wiki/request";

interface WikiPageResponse {
  title: string;
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

/**
 * Will dump all wiki pages
 */
export async function dumpAllWikiPages(): Promise<void> {
  // Todo: Use recentchanges + find the latest date to only update the ones that were changed
  const now = Date.now() / 1000;
  for (let i = 0; i < WikiPageList.length; i++) {
    if (i % 10 === 0) {
      console.info(
        `Request ${i} / ${WikiPageList.length} - ${Math.round(
          Math.round(Date.now() / 1000 - now)
        )} s elapsed`
      );
    }

    const currentPage = WikiPageList[i] as WikiPageSlim;

    await dumpWikiPageById(currentPage.pageid);
  }
}

export async function dumpWikiPageById(pageId: number) {
  const redirects = WikiRequest.getRedirectsToPage(pageId);
  const response = await WikiRequest.query<{ parse: WikiPageResponse }>({
    action: "parse",
    pageid: pageId.toString(),
    format: "json",
    prop: "properties|wikitext|displaytitle|subtitle|revid|text",
  }).catch((e) => console.error(e));
  if (!response) return;
  const result = response.parse as WikiPageResponse;

  const newPage: WikiPageWithContent = {
    pageid: pageId,
    pagename: result.title,
    title: result.displaytitle,
    displaytitle: result.displaytitle,
    revid: result.revid,
    redirects: await redirects,
    properties: result.properties.map((p) => ({
      name: p.name,
      value: p["*"],
    })),
    content: result.text["*"],
    rawContent: result.wikitext["*"],
  };

  writeFileSync(
    `${WIKI_PAGES_FOLDER}/${newPage.pageid}.json`,
    JSON.stringify(newPage)
  );
}
