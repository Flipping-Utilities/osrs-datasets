import axios from "axios";

export interface WikiPageTitle {
  pageid: number;
  title: string;
}

interface AllPagesResponse {
  batchcomplete: string;
  continue?: {
    apcontinue: string;
    cmcontinue: string;
    continue: string;
  };
  limits: {
    allpages: number;
  };
  query: {
    allpages: WikiPageTitle[];
    categorymembers: WikiPageTitle[];
  };
}

/**
 * Dumps all of the wiki page name + ids
 */
export async function dumpAllWikiPageNames(): Promise<WikiPageTitle[]> {
  let isFinished = true;
  let next: string = "";
  const pages: WikiPageTitle[] = [];
  let i = 0;
  do {
    if (i % 10 === 0) {
      console.info(`Request - ${pages.length} thus far`);
    }
    const response = await axios.get<AllPagesResponse>(
      `https://oldschool.runescape.wiki/api.php?action=query&list=allpages&aplimit=max` +
        `&format=json&apfilterredir=nonredirects&apminsize=5&apcontinue=${next}`
    );
    const newPages = response.data.query.allpages.map((p) => ({
      pageid: p.pageid,
      title: p.title,
    }));
    next = response.data?.continue?.apcontinue || "";
    isFinished = !Boolean(next);
    pages.push(...newPages);
  } while (!isFinished);

  return pages;
}

export async function dumpAllWikiItemNames(): Promise<WikiPageTitle[]> {
  let isFinished = true;
  let next: string = "";
  const pages: WikiPageTitle[] = [];
  let i = 0;
  do {
    if (i % 10 === 0) {
      console.info(`Request ${i} - ${pages.length} thus far`);
    }
    const response = await axios.get<AllPagesResponse>(
      `https://oldschool.runescape.wiki/api.php?action=query&cmlimit=max&format=json&cmtitle=Category%3AGrand Exchange items&list=categorymembers` +
        `&cmcontinue=${next}`
    );
    const newPages = response.data.query.categorymembers;
    next = response.data?.continue?.cmcontinue || "";
    isFinished = !Boolean(next);
    pages.push(...newPages);
  } while (!isFinished);

  return pages;
}
