export function getI18nKindWarning(
  astWarnings,
  warnings,
  getToken = (i18nToken) => i18nToken
) {
  return astWarnings.map((astWarning) => {
    const { i18n } = Object.values(warnings).find(
      (warning) => astWarning.kind === warning.code
    );

    return {
      ...astWarning,
      kind: getToken(i18n)
    };
  });
}
