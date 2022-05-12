import { readFileSync, writeFileSync } from "fs";
import AllShopsPageList from "../../data/items/all-shops-page-list";
import GEItems from "../../data/items/ge-items";
import { ALL_SETS, ALL_SHOPS, WIKI_PAGES_FOLDER } from "../paths";
import { Shop, ShopItem } from "../types";
import { WikiPageWithContent } from "../wiki/request";

const GEItemNameRecord: Record<string, number> = GEItems.reduce(
  (acc: Record<string, number>, item) => {
    acc[item.name] = item.id;
    return acc;
  },
  {}
);

export function extractAllShops(): Shop[] {
  const shops: Shop[] = [];
  for (let i = 0; i < AllShopsPageList.length; i++) {
    if (i % 100 === 0) {
      console.info(`Parsing item ${i}/${AllShopsPageList.length}`);
    }
    const page = AllShopsPageList[i];
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
     * Shop format:
     *  {{StoreTableHead|sellmultiplier=1300|buymultiplier=700|delta=30}}
     *  {{StoreLine|name=Small fishing net|stock=5|restock=100}}
     *  {{StoreLine|name=Fishing rod|stock=5|restock=100}}
     *  {{StoreLine|name=Fly fishing rod|stock=5|restock=100}}
     *  {{StoreTableBottom}}
     */

    const shopHeadRegex = /\{\{StoreTableHead\|(.+)\}\}/g;
    const shopHead = rawWikiPage.rawContent.match(shopHeadRegex);
    if (shopHead?.length === 0 || !shopHead) {
      console.info("No shop head", page.title, page.pageid);
      continue;
    }

    // @ts-ignore
    const shopMeta: [string, string | number][] = shopHead[0]
      .replace("{{StoreTableHead|", "")
      .replace("}}", "")
      .split("|")
      .map((v) => {
        let [key, value]: [string, string | number] = v.split("=") as [
          string,
          string
        ];
        if (!value) {
          console.warn("Key has no value", key);
          return;
        }
        if (!isNaN(Number(value))) {
          value = Number(value);
        }
        return [key, value];
      })
      .filter((v) => Boolean(v));
    // console.log(shopHead, rawWikiPage.title, rawWikiPage.pageid);
    const buyPercent =
      (shopMeta.find(
        (v) => v[0].toLowerCase() === "buymultiplier"
      )?.[1] as number) / 1000 || 0;
    const sellPercent =
      (shopMeta.find(
        (v) => v[0].toLowerCase() === "sellmultiplier"
      )?.[1] as number) / 1000 || 0;
    const buyChangePercent =
      (shopMeta.find((v) => v[0].toLowerCase() === "delta")?.[1] as number) /
        1000 || 0;

    const shopLineRegex = /\{\{StoreLine\|(.+)\}\}$/gm;

    // @ts-ignore
    const inventory = (
      rawWikiPage.rawContent.match(shopLineRegex)?.map((v) =>
        v
          .replace("{{StoreLine|", "")
          .replace(/\}\}$/, "")
          .split("|")
          .map((v) => {
            let [key, value]: [string, string | number] = v.split("=") as [
              string,
              string
            ];
            if (!value) {
              console.warn("Key has no value", key);
              return;
            }
            if (!isNaN(Number(value))) {
              value = Number(value);
            }
            return [key, value];
          })
          .filter((v) => v)
      ) as [string, string | number][][]
    )
      .map((v) => {
        const name = v.find((v) => v[0] === "name") || "";
        const geItem = GEItemNameRecord[name[1]];
        if (!geItem) {
          console.warn("Item is not on the GE", name[1]);
          return;
        }
        const stock = v.find((v) => v[0] === "stock") || ["stock", 0];
        const restock = v.find((v) => v[0] === "restock") || ["restock", 0];
        const item: ShopItem = {
          baseQuantity: stock[1] as number,
          itemId: geItem,
          restockTime: restock[1] as number,
        };
        return item;
      })
      .filter((v) => v);

    const shop: Shop = {
      name: page.title,
      pageId: page.pageid,
      buyPercent,
      sellPercent,
      buyChangePercent,
      inventory: inventory as ShopItem[],
    };
    shops.push(shop);
  }
  return shops;
}

export function dumpAllShops() {
  const sets = extractAllShops();
  writeFileSync(ALL_SHOPS, JSON.stringify(sets, null, 2));
}
