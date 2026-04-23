// Server component that compiles and renders MDX with custom components.

import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import { createHighlighter, type Highlighter } from "shiki";
import { visit } from "unist-util-visit";

import { Callout } from "./callout";
import { LegalCite } from "./legal-cite";
import { Quiz } from "./quiz";

// Shiki highlighter is expensive to create — memoise per process.
let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-dark"],
      langs: [
        "typescript",
        "javascript",
        "json",
        "yaml",
        "sql",
        "markdown",
        "bash",
      ],
    });
  }
  return highlighterPromise;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rehypeShiki(): (tree: any) => Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (tree: any) => {
    const highlighter = await getHighlighter();
    const loaded = highlighter.getLoadedLanguages();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    visit(tree, "element", (node: any) => {
      if (
        node.tagName === "pre" &&
        node.children?.length === 1 &&
        node.children[0]?.tagName === "code"
      ) {
        const codeNode = node.children[0];
        const className: string = codeNode.properties?.className?.[0] ?? "";
        const lang = className.replace("language-", "") || "text";
        const code: string = codeNode.children?.[0]?.value ?? "";

        const html = highlighter.codeToHtml(code.trimEnd(), {
          lang: loaded.includes(lang) ? lang : "text",
          theme: "github-dark",
        });

        node.type = "raw";
        node.value = html;
        node.children = [];
      }
    });
  };
}

const components = {
  Callout,
  LegalCite,
  Quiz,
};

export async function MdxRenderer({ source }: { source: string }) {
  return (
    <div className="prose prose-invert prose-slate max-w-none prose-headings:scroll-mt-20 prose-a:text-blue-400 prose-code:text-slate-300 prose-pre:bg-transparent prose-pre:p-0">
      <MDXRemote
        source={source}
        components={components}
        options={{
          // MDX here is repo-local and reviewed — enable JSX expression
          // attributes (e.g. <Quiz questions={[...]} />). Without this,
          // next-mdx-remote's default remark plugin strips the attributes
          // and components receive `undefined` for prop expressions.
          // blockDangerousJS stays on (its default) as a backstop.
          blockJS: false,
          mdxOptions: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            rehypePlugins: [rehypeSlug, rehypeShiki as any],
          },
        }}
      />
    </div>
  );
}
