/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { SystemTheme } from "../../../theme/SystemTheme";
import LicenseWindow from "../../LicenseWindow/LicenseWindow";

type LicenseProps = {
  theme: SystemTheme;
};

function License(props: LicenseProps) {
  return <LicenseWindow theme={props.theme} embedded />;
}

export default License;
