/**
 * Calculates the minimum bidding increment based on project budget.
 * Creates structured auction dynamics with professional pricing behavior.
 */

export function getMinimumIncrement(amount) {
  if (amount < 500) {
    return 25;
  } else if (amount < 2000) {
    return 50;
  } else {
    return 100;
  }
}

/**
 * Validates if a new bid meets the minimum increment requirement.
 * Returns { valid: boolean, message: string, nextValidRange: { min, max } }
 */
export function validateBidIncrement(newBidAmount, referenceBidAmount) {
  const currentLowestBid = referenceBidAmount;
  if (!currentLowestBid || newBidAmount === currentLowestBid) {
    return { valid: false, message: "Your quote must differ from your previous amount", nextValidRange: null };
  }

  const increment = getMinimumIncrement(currentLowestBid);
  const minValid = currentLowestBid - increment;
  const maxValid = currentLowestBid + increment;

  const isValid = newBidAmount <= minValid || newBidAmount >= maxValid;

  return {
    valid: isValid,
    message: isValid ? "Bid accepted" : `Bids must differ by at least £${increment}`,
    nextValidRange: {
      min: minValid,
      max: maxValid,
      current: currentLowestBid,
      increment,
    },
  };
}

/**
 * Suggests the nearest valid bid amounts for a given starting point
 */
export function getValidBidSuggestions(currentLowestBid, desiredAmount) {
  const increment = getMinimumIncrement(currentLowestBid);
  
  const lowerBid = currentLowestBid - increment;
  const higherBid = currentLowestBid + increment;

  // Return suggestions closer to desired amount
  if (desiredAmount < currentLowestBid) {
    return [lowerBid, currentLowestBid - (increment * 2)];
  } else {
    return [higherBid, currentLowestBid + (increment * 2)];
  }
}