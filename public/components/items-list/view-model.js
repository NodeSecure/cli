export function selectVisibleItems({
  items, isClosed, itemsToShowLength, shouldShowEveryItems = false
}) {
  const nonEmptyItems = items.filter((item) => item.trim() !== "");

  if (shouldShowEveryItems) {
    return nonEmptyItems;
  }

  return isClosed ? nonEmptyItems.slice(0, itemsToShowLength) : nonEmptyItems;
}
