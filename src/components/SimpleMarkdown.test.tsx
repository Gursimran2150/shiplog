import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { parseBlocks, SimpleMarkdown } from "./SimpleMarkdown";

describe("parseBlocks", () => {
  it("groups bullets and numbered items into lists", () => {
    const blocks = parseBlocks("# Title\nIntro\n- a\n- b\n1. one\n2. two\n---\nEnd");
    expect(blocks.map((b) => b.kind)).toEqual(["heading", "para", "list", "list", "rule", "para"]);
  });
});

describe("SimpleMarkdown", () => {
  it("renders bold text and list items", () => {
    render(<SimpleMarkdown text={"Call **112** now\n- Stay calm\n- Move to a lit area"} />);
    expect(screen.getByText("112").tagName).toBe("STRONG");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("never renders raw HTML from the model", () => {
    const { container } = render(<SimpleMarkdown text={'<img src=x onerror="alert(1)">'} />);
    expect(container.querySelector("img")).toBeNull();
  });

  it("renders https markdown links as safe external anchors", () => {
    render(<SimpleMarkdown text={"- Register at [eshram.gov.in](https://eshram.gov.in) with **Aadhaar**"} />);
    const link = screen.getByRole("link", { name: "eshram.gov.in" });
    expect(link).toHaveAttribute("href", "https://eshram.gov.in/");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText("Aadhaar").tagName).toBe("STRONG");
  });

  it("renders non-https links as plain text", () => {
    render(<SimpleMarkdown text={"[click me](javascript:alert(1)) and [plain](http://example.com)"} />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText(/click me/)).toBeInTheDocument();
    expect(screen.getByText(/plain/)).toBeInTheDocument();
  });

  it("renders headings as real headings below the page's own, plus _italic_ and `code`", () => {
    render(
      <SimpleMarkdown
        text={"# Fix login\n## How to test\n_Add screenshots._ Run `pnpm test` (not snake_case_names)"}
      />,
    );
    expect(screen.getByRole("heading", { level: 3, name: "Fix login" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 4, name: "How to test" })).toBeInTheDocument();
    expect(screen.getByText("Add screenshots.").tagName).toBe("EM");
    expect(screen.getByText("pnpm test").tagName).toBe("CODE");
    expect(screen.getByText(/snake_case_names/).tagName).toBe("P");
  });
});
