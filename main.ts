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
} from "./scripts/dumpers/page-list";
import { dumpAllSets, extractAllSets } from "./scripts/extractors/extract-sets";
import { dumpAllRecipes } from "./scripts/extractors/extract-recipes";

// dumpWikiPageList();
// TestGeItems();
// dumpGEItems();
// dumpAllItemPageList();
// dumpAllWikiPages();
// dumpItemSets();
// dumpAllSets();
dumpAllRecipes();
