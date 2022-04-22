import { writeFileSync } from "fs";
import { GE_ITEM_PAGE_LIST, WIKI_PAGE_LIST } from "../paths";
import { WikiPageSlim, WikiRequest } from "../wiki/request";

/**
 * Dumps all of the wiki page name + ids
 */
export async function fetchWikiPageList(): Promise<WikiPageSlim[]> {
  const properties = {
    action: "query",
    list: "allpages",
    aplimit: "max",
    format: "json",
    apfilterredir: "nonredirects",
    apminsize: "5",
  };

  const pages = await WikiRequest.queryAllPagesPromise<WikiPageSlim>(
    "apcontinue",
    "allpages",
    properties
  );
  // Wiki responses have 'ns' property, remove it
  return pages.map((p) => ({
    pageid: p.pageid,
    title: p.title,
  }));
}

/**
 * Writes the page list to the disk
 */
export async function dumpWikiPageList(): Promise<void> {
  const pages = await fetchWikiPageList();
  await writeFileSync(WIKI_PAGE_LIST, JSON.stringify(pages, null, 2));
}

/**
 * Fetches the list of items that are listed on the GE from the wiki
 */
export async function fetchGEItemList(): Promise<WikiPageSlim[]> {
  const properties = {
    action: "query",
    list: "categorymembers",
    cmtitle: "Category:Grand Exchange items",
    cmlimit: "max",
    format: "json",
  };

  const pages = await WikiRequest.queryAllPagesPromise<WikiPageSlim>(
    "cmcontinue",
    "categorymembers",
    properties
  );
  // Wiki responses have 'ns' property, remove it
  return pages.map((p) => ({
    pageid: p.pageid,
    title: p.title,
  }));
}

/**
 * Writes the page list to the disk
 */
export async function dumpGEItemList(): Promise<void> {
  const pages = await fetchGEItemList();
  await writeFileSync(GE_ITEM_PAGE_LIST, JSON.stringify(pages, null, 2));
}
