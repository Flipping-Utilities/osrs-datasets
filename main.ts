import {
  dumpGEItems,
  fetchGEItems,
  TestGeItems,
} from "./scripts/extractors/extract-ge-items";
import {
  dumpAllWikiPages,
  dumpWikiPageById,
} from "./scripts/dumpers/page-content";
import {
  dumpGEItemPageList,
  dumpAllItemPageList,
  dumpWikiPageList,
  dumpItemSetsPageList,
  dumpShopPageList,
  dumpRedirectList,
  dumpMonstersPageList,
} from "./scripts/dumpers/page-list";
import { dumpAllSets, extractAllSets } from "./scripts/extractors/extract-sets";
import { dumpAllRecipes } from "./scripts/extractors/extract-recipes";

import { dumpAllShops } from "./scripts/extractors/extract-shops";
import {
  dumpAllMonsters,
  extractAllMonsters,
} from "./scripts/extractors/extract-monsters";

// dumpWikiPageList();
// dumpAllWikiPages();
// dumpRedirectList();
// TestGeItems();
// dumpGEItemPageList();
dumpGEItems();
// dumpAllItemPageList();
// dumpAllSets();
// dumpAllRecipes();

// dumpShopPageList();
// dumpAllShops();

// dumpMonstersPageList();
// dumpAllMonsters();
// extractAllMonsters();
// dumpWikiPageById(357068);
