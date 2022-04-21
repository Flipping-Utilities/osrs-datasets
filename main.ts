import { writeFileSync } from "fs";
import { extractGEItems, testGeItems } from "./scripts/extract-ge-items";
import { dumpAllWikiPages } from "./scripts/get-page-content";
import { dumpAllWikiItemNames, dumpAllWikiPageNames } from "./scripts/get-pages";


function dumpItemNames() {
  return dumpAllWikiItemNames().then((r) => {
    writeFileSync(
      "./pages/ge-items-list.json",
      JSON.stringify(
        r.reduce((acc: Record<string, number>, i) => {
          acc[i.title] = i.pageid;
          return acc;
        }, {})
      )
    );
  });
}

// dumpItemNames();
extractGEItems();
testGeItems();
