// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WritingBrief } from "./writing-brief";

afterEach(cleanup);

describe("WritingBrief", () => {
  it("forwards a page-length instruction typed by the researcher", () => {
    const onChange = vi.fn();
    render(<WritingBrief value="" onChange={onChange} />);

    fireEvent.change(screen.getByRole("textbox", { name: "논문 작성 지시" }), {
      target: { value: "A4 20쪽 내외, APA 7판" },
    });

    expect(onChange).toHaveBeenCalledWith("A4 20쪽 내외, APA 7판");
  });
});
