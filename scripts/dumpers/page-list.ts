import { writeFileSync } from "fs";
import {
  ALL_ITEM_PAGE_LIST,
  ALL_SETS_PAGE_LIST,
  GE_ITEM_PAGE_LIST,
  WIKI_PAGE_LIST,
} from "../paths";
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
 * Fetches the list of all items
 */
export async function fetchAllItemPageList(
  category: string = "Items"
): Promise<WikiPageSlim[]> {
  const properties = {
    action: "query",
    list: "categorymembers",
    cmtitle: `Category:${category}`,
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
 * Fetches the list of all items that are listed on the GE
 */
export function fetchGEItemPageList(): Promise<WikiPageSlim[]> {
  return fetchAllItemPageList("Grand Exchange items");
}

/**
 * Writes the all item list to the disk
 */
export async function dumpAllItemPageList(): Promise<void> {
  const pages = await fetchAllItemPageList();
  await writeFileSync(ALL_ITEM_PAGE_LIST, JSON.stringify(pages, null, 2));
}

/**
 * Writes the GE page list to the disk
 */
export async function dumpGEItemPageList(): Promise<void> {
  const pages = await fetchGEItemPageList();
  await writeFileSync(GE_ITEM_PAGE_LIST, JSON.stringify(pages, null, 2));
}

export async function fetchItemSetsPageList() {
  return fetchAllItemPageList("Item_sets");
}
export async function dumpItemSetsPageList() {
  const pages = await fetchItemSetsPageList();
  await writeFileSync(ALL_SETS_PAGE_LIST, JSON.stringify(pages, null, 2));
}
