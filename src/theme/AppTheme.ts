/**
 * Copyright (c) 2023-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { getAppColors } from './AppColors';
import { createTheme } from "@mui/material/styles";
import { SystemTheme } from './SystemTheme';

export class AppTheme {

  private static readonly LightColors = getAppColors(SystemTheme.LIGHT);
  private static readonly DarkColors = getAppColors(SystemTheme.DARK);

  private static getSharedThemeConfig() {
    return {
      typography: {
        h1: {
          fontSize: 86
        },
        h2: {
          fontSize: 52
        },
        h3: {
          fontSize: 42
        },
        h4: {
          fontSize: 30
        },
        h5: {
          fontSize: 22
        },
        h6: {
          fontSize: 18
        },
        body1: {
          fontSize: 14
        },
        body2: {
          fontSize: 12
        }
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              minWidth: 0
            }
          },
          variants: [
            {
              props: {
                variant: "toolbar"
              },
              style: {
                boxShadow: "none"
              }
            },
            {
              props: {
                variant: "toolbarNegative"
              },
              style: {
                boxShadow: "none"
              }
            }
          ]
        }
      }
    };
  }
  
  // Overrides default MUI styles.
  public static LightTheme = createTheme({
    palette: {
      mode: "light",
      primary: {
        light: this.LightColors.MAIN_LIGHT,
        main: this.LightColors.MAIN,
        dark: this.LightColors.MAIN_DARK,
        contrastText: this.LightColors.MAIN_TEXT
      },
      secondary: {
        light: this.LightColors.SECONDARY_LIGHT,
        main: this.LightColors.SECONDARY,
        dark: this.LightColors.SECONDARY_DARK,
        contrastText: this.LightColors.SECONDARY_TEXT
      },
      background: {
        default: this.LightColors.ACCENT,
        paper: this.LightColors.NEW_NOTE_BG
      }
    },
    ...AppTheme.getSharedThemeConfig(),
    components: {
      ...AppTheme.getSharedThemeConfig().components,
      MuiCssBaseline: {
        styleOverrides: {
          textarea: {
            color: this.LightColors.NOTE_TEXT + " !important",
            caretColor: this.LightColors.NOTE_TEXT,
            WebkitTextFillColor: this.LightColors.NOTE_TEXT + " !important"
          },
          "textarea::placeholder": {
            color: this.LightColors.NOTE_PLACEHOLDER_TEXT,
            WebkitTextFillColor: this.LightColors.NOTE_PLACEHOLDER_TEXT,
            opacity: 1
          }
        }
      },
      MuiAppBar: {
        styleOverrides: {
          colorPrimary: {
            backgroundColor: this.LightColors.APPBAR_BACKGROUND,
            color: this.LightColors.APPBAR_TEXT
          }
        }
      },
      MuiButton: {
        ...AppTheme.getSharedThemeConfig().components.MuiButton,
        styleOverrides: {
          root: {
            minWidth: 0,
            "&.MuiButton-toolbar.Mui-disabled, &.MuiButton-toolbarNegative.Mui-disabled": {
              color: this.LightColors.DISABLED_TEXT,
              outline: "1px solid " + this.LightColors.DISABLED_TEXT
            }
          }
        },
        variants: [
          {
            props: {
              variant: "toolbar"
            },
            style: {
              backgroundColor: this.LightColors.MAIN,
              outline: "1px solid " + this.LightColors.TOOLBAR_VARIANT_OUTLINE,
              boxShadow: "none",
              '&:hover': {
                backgroundColor: this.LightColors.TOOLBAR_VARIANT_HOVER_BACKGROUND,
                outline: "1px solid " + this.LightColors.TOOLBAR_VARIANT_HOVER_OUTLINE
              }
            }
          },
          {
            props: {
              variant: "toolbarNegative"
            },
            style: {
              backgroundColor: this.LightColors.MAIN,
              outline: "1px solid " + this.LightColors.TOOLBAR_VARIANT_OUTLINE,
              boxShadow: "none",
              transition: "none",
              '&:hover': {
                backgroundColor: this.LightColors.TOOLBAR_DELETE_BUTTON_HOVER_BACKGROUND,
                outline: "1px solid " + this.LightColors.TOOLBAR_DELETE_BUTTON_HOVER_BORDER
              }
            }
          }
        ]
      }
    }
  });

  public static DarkTheme = createTheme({
    palette: {
      mode: "dark",
      primary: {
        light: this.DarkColors.MAIN_LIGHT,
        main: this.DarkColors.MAIN,
        dark: this.DarkColors.MAIN_DARK,
        contrastText: this.DarkColors.MAIN_TEXT
      },
      secondary: {
        light: this.DarkColors.SECONDARY_LIGHT,
        main: this.DarkColors.SECONDARY,
        dark: this.DarkColors.SECONDARY_DARK,
        contrastText: this.DarkColors.SECONDARY_TEXT
      },
      background: {
        default: this.DarkColors.ACCENT,
        paper: this.DarkColors.NEW_NOTE_BG
      },
      text: {
        primary: this.DarkColors.MAIN_TEXT,
        secondary: this.DarkColors.SECONDARY_TEXT
      }
    },
    ...AppTheme.getSharedThemeConfig(),
    components: {
      ...AppTheme.getSharedThemeConfig().components,
      MuiCssBaseline: {
        styleOverrides: {
          textarea: {
            color: this.DarkColors.NOTE_TEXT + " !important",
            caretColor: this.DarkColors.NOTE_TEXT,
            WebkitTextFillColor: this.DarkColors.NOTE_TEXT + " !important"
          },
          "textarea::placeholder": {
            color: this.DarkColors.NOTE_PLACEHOLDER_TEXT,
            WebkitTextFillColor: this.DarkColors.NOTE_PLACEHOLDER_TEXT,
            opacity: 1
          }
        }
      },
      MuiAppBar: {
        defaultProps: {
          enableColorOnDark: true
        },
        styleOverrides: {
          colorPrimary: {
            backgroundColor: this.DarkColors.APPBAR_BACKGROUND,
            color: this.DarkColors.APPBAR_TEXT
          }
        }
      },
      MuiButton: {
        ...AppTheme.getSharedThemeConfig().components.MuiButton,
        styleOverrides: {
          root: {
            minWidth: 0,
            "&.MuiButton-toolbar.Mui-disabled, &.MuiButton-toolbarNegative.Mui-disabled": {
              color: this.DarkColors.DISABLED_TEXT,
              outline: "1px solid " + this.DarkColors.DISABLED_TEXT
            }
          }
        },
        variants: [
          {
            props: {
              variant: "toolbar"
            },
            style: {
              backgroundColor: "transparent",
              color: this.DarkColors.MAIN_TEXT,
              outline: "1px solid " + this.DarkColors.TOOLBAR_VARIANT_OUTLINE,
              boxShadow: "none",
              '&:hover': {
                backgroundColor: this.DarkColors.TOOLBAR_VARIANT_HOVER_BACKGROUND,
                outline: "1px solid " + this.DarkColors.TOOLBAR_VARIANT_HOVER_OUTLINE
              }
            }
          },
          {
            props: {
              variant: "toolbarNegative"
            },
            style: {
              backgroundColor: "transparent",
              color: this.DarkColors.MAIN_TEXT,
              outline: "1px solid " + this.DarkColors.TOOLBAR_VARIANT_OUTLINE,
              boxShadow: "none",
              transition: "none",
              '&:hover': {
                backgroundColor: this.DarkColors.TOOLBAR_DELETE_BUTTON_HOVER_BACKGROUND,
                outline: "1px solid " + this.DarkColors.TOOLBAR_DELETE_BUTTON_HOVER_BORDER
              }
            }
          }
        ]
      }
    }
  });
  
}
 
