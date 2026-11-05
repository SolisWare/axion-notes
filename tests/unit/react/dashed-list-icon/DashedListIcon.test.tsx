/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import "@testing-library/jest-dom/vitest";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DashedListIcon from "../../../../src/components/DashedListIcon";
import styles from "../../../../src/components/DashedListIcon.module.css";

describe("DashedListIcon", () => {
  it("renders a decorative three-row dashed-list glyph", () => {
    const { container } = render(<DashedListIcon />);
    const icon = container.firstElementChild;

    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveClass(styles.icon);

    const rows = icon?.querySelectorAll(`.${styles.row}`);
    expect(rows).toHaveLength(3);
    rows?.forEach((row) => {
      expect(row.children).toHaveLength(2);
      expect(row.children[0]).toHaveClass(styles.marker);
      expect(row.children[1]).toHaveClass(styles.line);
    });
  });
});
