import { writeFileSync } from "fs";
import { extractGEItems } from "./scripts/extract-ge-items";
import { dumpAllWikiItemNames } from "./scripts/get-pages";

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
