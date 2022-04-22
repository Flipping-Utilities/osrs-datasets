import { readFileSync, writeFileSync } from "fs";
import GEItemPageList from "../../data/items/ge-item-page-list";
import GEItems from "../../data/items/ge-items";
import { ALL_GE_RECIPES, ALL_SETS, WIKI_PAGES_FOLDER } from "../paths";
import { Recipe, RecipeMaterial, RecipeSkill } from "../types";
import { WikiPageWithContent } from "../wiki/request";
import parse from "infobox-parser";

const GEItemNameRecord: Record<string, number> = GEItems.reduce(
  (acc: Record<string, number>, item) => {
    acc[item.name] = item.id;
    return acc;
  },
  {}
);

type WikiMaterialKey = "" | "quantity" | "cost" | "itemnote" | "txt" | "subtxt";
const WikiMaterialKeyToRecipeMaterialKey: Record<
  WikiMaterialKey,
  keyof RecipeMaterial
> = {
  "": "id",
  quantity: "quantity",
  cost: "cost",
  itemnote: "notes",
  txt: "text",
  subtxt: "subText",
};
type WikiSkillKeys = "" | "lvl" | "boostable" | "exp";
const WikiSkillKeyToRecipeSkillKey: Record<WikiSkillKeys, keyof RecipeSkill> = {
  "": "name",
  boostable: "boostable",
  exp: "xp",
  lvl: "lvl",
};

function parseRecipe(recipeText: string): Recipe | null {
  const rawRecipe = parse(recipeText);
  if (!rawRecipe || !rawRecipe.general) {
    console.warn("Could not parse recipe!");
    return null;
  }

  const recipeProperties = rawRecipe.general;

  const skills: RecipeSkill[] = [];
  const skillKeys = Object.keys(recipeProperties).filter((k) =>
    k.startsWith("skill")
  );
  const baseSkill: RecipeSkill = {
    boostable: true,
    lvl: 1,
    name: "Unknown",
    xp: 0,
  };

  skillKeys.forEach((key) => {
    const withoutSkill = key.split("skill")[1];
    let property = withoutSkill.split(/^\d+/)[1] as WikiSkillKeys;
    const index = Number(property.replace(property, ""));

    if (!skills[index]) {
      skills[index] = { ...baseSkill };
    }
    let value = recipeProperties[key];
    switch (property) {
      case "lvl":
      case "exp":
        value = Number(value);
        break;
      case "boostable":
        value = Boolean(value);
        break;
      case "":
        break;
      default:
        console.warn(`Unknown recipe skill property: ${property}`);
        break;
    }
    // @ts-ignore
    skills[index][WikiSkillKeyToRecipeSkillKey[property]] = value;
  });

  const baseMaterial: RecipeMaterial = {
    id: 0,
    quantity: 1,
  };

  const inputs: RecipeMaterial[] = convertMaterialsToObject(
    recipeProperties,
    "mat"
  );
  const outputs: RecipeMaterial[] = convertMaterialsToObject(
    recipeProperties,
    "output"
  );

  const ticks = isNaN(Number(recipeProperties.ticks))
    ? null
    : Number(recipeProperties.ticks);

  const recipe: Recipe = {
    inputs,
    outputs,
    members:
      recipeProperties.members === "Yes" || recipeProperties.members === true,
    skills,
    ticks,
    ticksNote: recipeProperties.ticksnote,
    toolIds: [],
    facility: recipeProperties.facility,
    name: recipeProperties.name,
    notes: recipeProperties.notes,
  };

  return recipe;
}

function convertMaterialsToObject(
  rawRecipe: Record<string, string>,
  prefix: string
): RecipeMaterial[] {
  const baseMaterial: RecipeMaterial = {
    id: 0,
    quantity: 1,
  };
  const materials: RecipeMaterial[] = [];
  const materialKeys = Object.keys(rawRecipe).filter((k) =>
    k.startsWith(prefix)
  );

  materialKeys.forEach((key) => {
    const withoutMat = key.split(prefix)[1];
    let property = withoutMat.split(/^\d+/)[1] as WikiMaterialKey;
    const index = Number(property.replace(property, ""));

    if (!materials[index]) {
      materials[index] = { ...baseMaterial };
    }
    let value: any = rawRecipe[key];
    switch (property) {
      case "":
        const id = value === "Coins" ? 995 : GEItemNameRecord[value];
        if (!id) {
          console.warn(`Recipe uses an unknown item: ${value}`);
          return;
        }
        value = id;
        break;
      case "quantity":
      case "cost":
        const nb = Number(value);
        // Ignore default strings
        if (!isNaN(nb)) {
          value = nb;
        } else {
          value = baseMaterial[WikiMaterialKeyToRecipeMaterialKey[property]];
        }
        break;
      case "itemnote":
        // Keep string
        break;
      default:
        console.warn(`Unknown recipe material property: ${property}!`);
        // Skip this recipe component: it's not a known property
        return;
    }
    // @ts-ignore
    materials[index][WikiMaterialKeyToRecipeMaterialKey[property]] = value;
  });

  return materials;
}

export function extractAllRecipes(): Recipe[] {
  const recipes: Recipe[] = [];
  for (let i = 0; i < GEItemPageList.length; i++) {
    if (i % 100 === 0) {
      console.info(`Parsing item ${i}/${GEItemPageList.length}`);
    }
    const page = GEItemPageList[i];
    let rawWikiPage;
    try {
      rawWikiPage = JSON.parse(
        readFileSync(`${WIKI_PAGES_FOLDER}/${page.pageid}.json`, "utf8")
      ) as WikiPageWithContent;
    } catch (e) {
      console.warn(`Page not downloaded: (${page.pageid}) ${page.title}`);
      continue;
    }

    const hasRecipe = rawWikiPage.rawContent.includes("{{Recipe");
    if (!hasRecipe) {
      // Item has no recipes
      continue;
    }

    const recipesText = rawWikiPage.rawContent
      .split("{{Recipe")
      .map((v) => "{{Recipe" + v)
      // End at the end of the recipe, not at the end of the file.
      .map((v) => v.split("\n}}")[0] + "\n}}");
    // Remove the first one: It's before the first recipe
    recipesText.shift();

    const newRecipes: Recipe[] = recipesText
      .map((text) => parseRecipe(text))
      .filter((v) => v) as Recipe[];

    recipes.push(...newRecipes);
  }

  return recipes;
}

export function dumpAllRecipes() {
  const sets = extractAllRecipes();
  writeFileSync(ALL_GE_RECIPES, JSON.stringify(sets, null, 2));
}
