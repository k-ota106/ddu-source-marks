import {
  BaseSource,
  Item,
} from "https://deno.land/x/ddu_vim@v0.2.4/types.ts#^";
import { Denops, fn } from "https://deno.land/x/ddu_vim@v0.2.4/deps.ts";
import { ActionData } from "https://deno.land/x/ddu_kind_file@v0.1.0/file.ts#^";
import { relative } from "https://deno.land/std@0.122.0/path/mod.ts#^";
import { isAbsolute, join } from "https://deno.land/std@0.125.0/path/mod.ts";
import { Env } from "https://deno.land/x/env@v2.2.0/env.js";
const env = new Env();

//type Params = Record<never, never>;
type Params = {
    jumps: boolean
};

export class Source extends BaseSource<Params> {
  kind = "file";

  gather(args: {
    denops: Denops;
    sourceParams: Params;
  }): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        // Note: rviminfo! is broken in Vim8 before 8.2.2494
        if (
          await fn.has(args.denops, "nvim") ||
          await fn.has(args.denops, "patch-8.2.2494")
        ) {
          await args.denops.cmd("wviminfo | rviminfo!");
        }

        const cwd = await fn.getcwd(args.denops) as string;
        const home = env.get("HOME", "~");

        const target = args.sourceParams.jumps ? "jumps" : "marks";
        const marklist_s = await fn.execute(args.denops, target);
        let marklist = marklist_s.split("\n").filter((f) => (f.length >= 3));

        controller.enqueue( [{ word: marklist[0], action:{bufNr: ''} }] );
        marklist.shift();

        const exists = async (filename: string) => {
          try {
            const stat = await Deno.stat(filename);
            return stat.isFile;
          } catch (_) {
            return false;
          }
        };

        for (var item of marklist) {
            const a = item.split(' ').filter(Boolean)
            if (a.length >= 4) {
                let path = a[3];
                let fullPath;
                if (path[0] == "~") {
                    fullPath = await path.replace(/^~/, home); 
                } else {
                    fullPath = isAbsolute(path) ? path : join(cwd, path);
                }
                const nr   = Number(a[1]); 
                const col  = Number(a[2]); 
                if (await exists(fullPath)) {
                    controller.enqueue([{ 
                        word: item,
                        action: {
                            path: fullPath,
                            lineNr: nr,
                            col: col,
                        }
                    }]);
                } else {
                    controller.enqueue([{ 
                        word: item,
                        action: {
                            bufnr: '',
                            lineNr: nr,
                            col: col,
                        }
                    }]);
                }
            }
        }

        controller.close();
      },
    });
  }

  params(): Params {
    //return {};
    return { jumps: false };
  }
}
