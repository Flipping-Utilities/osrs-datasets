import axios from "axios";

export interface ApiQueryBase {
  batchcomplete: string;
  continue: {
    continue: string;
  };
  limits: {};
  query: {};
}

export interface CategorySearch extends ApiQueryBase {
  continue: {
    cmcontinue: string;
    continue: string;
  };
  limits: {
    categorymembers: number;
  };
  query: {
    categorymembers: WikiPageSlim[];
  };
}

export interface PageSearch extends ApiQueryBase {
  continue: {
    apcontinue: string;
    continue: string;
  };
  limits: {
    allpages: number;
  };
  query: {
    allpages: WikiPageSlim[];
  };
}

export interface ParsePage {
  parse: WikiPageWithContent;
}

// Structure when using the API to query a page
export interface WikiPageWithContent {
  pagename: string;
  title: string;
  pageid: number;
  revid: number;
  content: string;
  rawContent: string;
  displaytitle: string;
  properties: { name: string; value: string }[];
}

export type WikiPageSlim = Pick<WikiPageWithContent, "pageid" | "title">;

export class WikiRequest {
  public static readonly baseUrl: string =
    "https://oldschool.runescape.wiki/api.php";

  public static async query<T>(
    params: { action: string } & Record<string, string>
  ): Promise<T> {
    const response = await axios.get<T>(WikiRequest.baseUrl, {
      params,
      headers: {
        "User-Agent": "Anyny0#4452 - Wiki tools",
      },
    });

    return response.data;
  }

  public static async queryAllPagesPromise<T>(
    paginationKey: "cmcontinue" | "apcontinue",
    resultKey: "categorymembers" | "allpages",
    params: { action: string } & Record<string, string>
  ) {
    const result: T[] = [];
    let isDone = false;
    const query = this.queryAllPages(paginationKey, resultKey, params);
    do {
      const { value, done } = await query.next();
      result.push(...value);
      isDone = Boolean(done);
    } while (!isDone);
    return result;
  }

  public static queryAllPages = async function* <T>(
    paginationKey: "cmcontinue" | "apcontinue",
    resultKey: "categorymembers" | "allpages",
    params: { action: string } & Record<string, string>
  ): AsyncGenerator<T[]> {
    let next = "";
    let hasNext = true;
    let i = 0;
    do {
      if (i++ % 10 === 0) {
        console.info(`Querying pages: ${i}`);
      }
      const response = await axios.get<PageSearch & CategorySearch>(
        WikiRequest.baseUrl,
        {
          params: {
            ...params,
            [paginationKey]: next,
          },
          headers: {
            "User-Agent": "Anyny0#4452 - Wiki tools",
          },
        }
      );

      next = response.data.continue?.[paginationKey];
      hasNext = Boolean(next);
      // @ts-ignore
      const values = response.data.query[resultKey] as T[];
      yield values;
    } while (hasNext);
  };
}
