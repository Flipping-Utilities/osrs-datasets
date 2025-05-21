// Usage: node --experimental-strip-types update.ts
// Validate content: Then replace recipes.json with new-recipes.json
import * as fs from "fs";

type inoutput = { quantity: number; id: number };
type recipe = {
  inputs: inoutput[];
  outputs: inoutput[];
  name?: string;
};

const newRecipesUrl =
  "https://github.com/Flipping-Utilities/parsed-osrs/raw/refs/heads/main/data/items/all-recipes.json";
const itemsUrl =
  "https://github.com/Flipping-Utilities/parsed-osrs/raw/refs/heads/main/data/items/all-items.json";

const oldRecipes: recipe[] = JSON.parse(
  fs.readFileSync("./recipes.json", "utf-8")
);
const newRecipes = await fetch(newRecipesUrl).then((r) => r.json());
const allItems = await fetch(itemsUrl).then((r) => r.json());
const items = allItems.reduce((acc, v) => {
  acc[v.id] = v;
  return acc;
}, {});

const makeId = (input: inoutput[], outputs: inoutput[]) => {
  if (!input || !outputs) {
    console.log(input, outputs);
    return "null";
  }
  return (
    input
      .filter((v) => v)
      .sort((a, b) => a.id - b.id)
      .map((v) => `${v.quantity}x${v.id}`)
      .join("+") +
    "=" +
    outputs
      .filter((v) => v)
      .sort((a, b) => a.id - b.id)
      .map((v) => `${v.quantity}x${v.id}`)
      .join("+")
  );
};

const oldRecipeMap = oldRecipes.reduce((acc, r) => {
  const id = makeId(r.inputs, r.outputs);
  acc.set(id, r);
  return acc;
}, new Map());

const brandNewRecipes = newRecipes
  .filter((v) => v.inputs.every((v) => v?.id))
  .filter((v) => v.outputs.every((v) => v?.id))
  .filter((r) => {
    const id = makeId(r.inputs, r.outputs);
    if (oldRecipeMap.has(id)) {
      return false;
    }
    return true;
  })
  .filter(
    (v) =>
      // Only include tradeable items, or coins
      v.inputs.every(
        (i) => i.id === 995 || items[i.id]?.isOnGrandExchange !== false
      ) &&
      v.outputs.every(
        (i) => i.id === 995 || items[i.id]?.isOnGrandExchange !== false
      )
  )
  .filter(
    (v) =>
      // Remove recipe with decimals (plugin only supports whole numbers)
      v.inputs.every((i) => !i.quantity.toString().includes(".")) &&
      v.outputs.every((o) => !o.quantity.toString().includes("."))
  )
  .sort(
    // Sort by highest id, just to have one sortable way to store them.
    (a, b) =>
      Math.max(
        ...[...a.inputs.map((i) => i.id), ...a.outputs.map((i) => i.id)]
      ) -
      Math.max(...[...b.inputs.map((i) => i.id), ...b.outputs.map((i) => i.id)])
  );

fs.writeFileSync(
  "brandnew.json",
  JSON.stringify(
    brandNewRecipes.map((v) => {
      return {
        inputs: v.inputs,
        outputs: v.outputs,
        // Todo: Find better way to name.
        name: `Making ${v.outputs.map((o) => items[o.id]?.name).join("+")}`,
      };
    }),
    null,
    2
  )
);

fs.writeFileSync(
  "newRecipes.json",
  JSON.stringify([
    ...oldRecipes,
    ...brandNewRecipes.map((v) => {
      return {
        inputs: v.inputs,
        outputs: v.outputs,
        name: `Making ${v.outputs.map((o) => items[o.id].name).join("+")}`,
      };
    }),
  ])
);

console.log(
  "Old length",
  oldRecipes.length,
  "New length",
  newRecipes.length,
  "Brand new recipes",
  brandNewRecipes.length
);
