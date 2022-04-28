export function getI18nKindWarning(
  warnings,
  constants,
  getToken = (i18nToken) => i18nToken
) {
  return warnings.map((warning) => {
    return {
      ...warning,
      kind: getToken(
        Object.values(constants.Warnings).find(
          (constantWarning) => warning.kind === constantWarning.code
        )?.i18n
      )
    };
  });
}
