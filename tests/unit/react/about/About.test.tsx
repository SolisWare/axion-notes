/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import About from "../../../../src/views/SettingsWindow/pages/About";
import { SystemTheme } from "../../../../src/theme/SystemTheme";
import { installDesktopApiMock } from "../../../utils/electron/createDesktopApiMock";

const getAboutDisplayVersion = vi.hoisted(() => vi.fn());
const originalVersionConfig = import.meta.env.VITE_APP_VERSION_CONFIG;

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string>) => key === "version"
      ? `Version ${values?.version}`
      : key === "rightsReserved"
        ? "All rights reserved."
        : key
  })
}));
vi.mock("../../../../src/utils/app-version/AppVersionResolver", () => ({
  AppVersionResolver: { getAboutDisplayVersion }
}));

describe("About", () => {
  beforeEach(() => {
    getAboutDisplayVersion.mockReset().mockReturnValue("9.8.7 (Test release)");
    delete import.meta.env.VITE_APP_VERSION_CONFIG;
  });

  afterEach(() => {
    if (originalVersionConfig === undefined) {
      delete import.meta.env.VITE_APP_VERSION_CONFIG;
    } else {
      import.meta.env.VITE_APP_VERSION_CONFIG = originalVersionConfig;
    }
  });

  it.each([SystemTheme.LIGHT, SystemTheme.DARK])("renders branded, localized About content with the %s theme", (theme) => {
    installDesktopApiMock({
      version: { getShortDisplayVersion: vi.fn(() => "v9.8.7") }
    });
    const { container } = render(<About theme={theme} />);

    expect(screen.getByText("Axion Notes")).toBeVisible();
    expect(screen.getByText("Version 9.8.7")).toBeVisible();
    expect(screen.getByText(`Copyright © 2023-${new Date().getFullYear()} SolisWare.`)).toBeVisible();
    expect(screen.getByText("All rights reserved.")).toBeVisible();
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("uses the Vite version configuration when it is available", () => {
    import.meta.env.VITE_APP_VERSION_CONFIG = JSON.stringify({ majorVersion: 9 });
    const desktopApi = installDesktopApiMock();

    render(<About theme={SystemTheme.LIGHT} />);

    expect(screen.getByText("Version 9.8.7 (Test release)")).toBeVisible();
    expect(getAboutDisplayVersion).toHaveBeenCalledWith({ majorVersion: 9 });
    expect(desktopApi.version.getShortDisplayVersion).not.toHaveBeenCalled();
  });
});
