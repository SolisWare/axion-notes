# 🌎 Contributing Translations

Thank you for helping make Axion Notes available to more people.

Axion Notes uses English as the source locale and includes a full Polish translation and a partial Estonian translation. Partial translations are welcome, and missing strings fall back to English while translation coverage improves.

## How To Add A Translation
1. Create a branch in your fork, for example `translation/spanish`.
2. Copy `src/i18n/locales/en/en.json` to `src/i18n/locales/<lang-code>/<lang-code>.json`.
3. Translate the values only. Keep JSON keys, nesting, punctuation placeholders, and any `{{variables}}` unchanged.
4. Add the language to `src/i18n/languages.ts`, for example:

   ```ts
   {
     code: "es",
     label: "Spanish"
   }
   ```

   Use the English language name for `label`. The language picker gets the native display name from the app's internationalization data.

5. Open a Pull Request from your branch against the upstream `develop` branch.

## Translation Guidelines
- Do not translate product names such as Axion Notes or author/brand names such as SolisWare.
- Keep variables such as `{{count}}`, `{{name}}`, or other placeholder text exactly as written.
- Keep translated UI text short enough to fit buttons, menus, and settings labels.
- If a phrase does not translate cleanly, prefer natural wording over a literal translation.
- If you are not sure about a string, leave it in English or mention the question in your pull request.

## Improving Existing Translations
You can also help by improving existing translations, completing partial translations, or reviewing translated strings for accuracy and tone.

For partial translation work, translate the sections you are confident about and keep the remaining English fallback behavior intact.
