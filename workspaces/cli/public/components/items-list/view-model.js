/**
 * @param {Object} params
 * @param {string[]} params.items
 * @param {boolean} params.isClosed
 * @param {number} params.itemsToShowLength
 * @param {boolean} [params.shouldShowEveryItems]
 */
export function selectVisibleItems({
  items, isClosed, itemsToShowLength, shouldShowEveryItems = false
}) {
  const nonEmptyItems = items.filter((item) => item.trim() !== "");

  if (shouldShowEveryItems) {
    return nonEmptyItems;
  }

  return isClosed ? nonEmptyItems.slice(0, itemsToShowLength) : nonEmptyItems;
}
