export function selectLicenses(licenses, unpkgRoot) {
  const processedLicenses = new Set();

  return licenses.flatMap((license) => {
    const [licenseName, licenseLink] = Object.entries(license.licenses)[0];
    if (processedLicenses.has(licenseName)) {
      return [];
    }
    processedLicenses.add(licenseName);

    return [
      {
        title: licenseName,
        spdx: Object.entries(license.spdx).map(([key, value]) => `${value ? "✔️" : "❌"} ${key}`),
        fileName: license.from,
        fileHref: `${unpkgRoot}${license.from}`,
        titleHref: licenseLink
      }
    ];
  });
}
