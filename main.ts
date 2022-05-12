import {
  dumpGEItems,
  fetchGEItems,
  TestGeItems,
} from "./scripts/extractors/extract-ge-items";
import { dumpAllWikiPages } from "./scripts/dumpers/page-content";
import {
  dumpGEItemPageList,
  dumpAllItemPageList,
  dumpWikiPageList,
  dumpItemSetsPageList,
  dumpShopPageList,
} from "./scripts/dumpers/page-list";
import { dumpAllSets, extractAllSets } from "./scripts/extractors/extract-sets";
import { dumpAllRecipes } from "./scripts/extractors/extract-recipes";
import { dumpAllShops } from "./scripts/extractors/extract-shops";

// dumpWikiPageList();
// dumpAllWikiPages();
// TestGeItems();
// dumpGEItems();
// dumpAllItemPageList();
// dumpItemSets();
// dumpAllSets();
// dumpAllRecipes();

// dumpShopPageList();
dumpAllShops();