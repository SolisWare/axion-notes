/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import GitHubIcon from "@mui/icons-material/GitHub";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import { useTranslation } from "react-i18next";
import styles from "./SettingsPages.module.css";

const links = [
  {
    labelKey: "settingsWindow.links.website.label",
    descriptionKey: "settingsWindow.links.website.description",
    href: "https://solisware.com",
    icon: <PublicOutlinedIcon fontSize="small" />
  },
  {
    labelKey: "settingsWindow.links.github.label",
    descriptionKey: "settingsWindow.links.github.description",
    href: "https://github.com/SolisWare",
    icon: <GitHubIcon fontSize="small" />
  }
];

function Links() {
  const { t } = useTranslation();

  return (
    <div className={styles.linksPage}>
      <div className={styles.linksHeader}>
        <p className={styles.pageDescription}>
          {t("settingsWindow.links.description")}
        </p>
      </div>
      <div className={styles.linksList}>
        {links.map((link) => (
          <a
            className={styles.linkCard}
            href={link.href}
            key={link.href}
            rel="noreferrer"
            target="_blank"
          >
            <span className={styles.linkIcon}>{link.icon}</span>
            <span className={styles.linkText}>
              <span className={styles.linkLabel}>{t(link.labelKey)}</span>
              <span className={styles.linkDescription}>{t(link.descriptionKey)}</span>
            </span>
            <OpenInNewOutlinedIcon className={styles.linkOpenIcon} fontSize="small" />
          </a>
        ))}
      </div>
    </div>
  );
}

export default Links;
