/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import GitHubIcon from "@mui/icons-material/GitHub";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import styles from "./SettingsPages.module.css";

const links = [
  {
    label: "Website",
    description: "Visit SolisWare for the latest product updates, downloads, and more from the team.",
    href: "https://solisware.com",
    icon: <PublicOutlinedIcon fontSize="small" />
  },
  {
    label: "GitHub",
    description: "Follow SolisWare on GitHub to find projects, releases, and source updates.",
    href: "https://github.com/SolisWare",
    icon: <GitHubIcon fontSize="small" />
  }
];

function Links() {
  return (
    <div className={styles.linksPage}>
      <div className={styles.linksHeader}>
        <p className={styles.pageDescription}>
          Thanks for using X-NoTES. These links help you follow releases, source updates, and other SolisWare projects.
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
              <span className={styles.linkLabel}>{link.label}</span>
              <span className={styles.linkDescription}>{link.description}</span>
            </span>
            <OpenInNewOutlinedIcon className={styles.linkOpenIcon} fontSize="small" />
          </a>
        ))}
      </div>
    </div>
  );
}

export default Links;
