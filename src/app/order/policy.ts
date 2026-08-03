/* ==================================================================== *
 * ORDER POLICIES — PLACEHOLDERS. NOTHING HERE IS SET.
 *
 * Every value below is `null` on purpose. These are the promises a shop
 * normally makes at the moment of payment — when it arrives, how long you have
 * to change it, whether you can have your money back — and the owner has not
 * stated any of them. Inventing them here would put words in his mouth that a
 * customer could reasonably hold him to, so the pages fall back to what is
 * already true: message us, a real person answers.
 *
 * TO SET ONE: replace the null with the sentence you want customers to read.
 * It appears on /order/confirmed (and /order/cancelled where relevant) with no
 * other change. Write it as a plain statement, in the second person, and only
 * promise what can actually be done every single time.
 *
 * Legal note for the refund line specifically: perishable food is exempt from
 * the 14-day distance-selling right to cancel under the Consumer Contracts
 * Regulations 2013, but that exemption does not cover goods that arrive faulty
 * or not as described. Whatever is written there has to leave that route open.
 * Worth thirty minutes of proper advice before publishing it.
 * ==================================================================== */

export interface OrderPolicies {
  /**
   * When a one-off order actually turns up. The subscription drop day is a
   * stated fact (DELIVERY.dropDay); a lead time for one-off orders is not.
   *
   * e.g. "Orders placed before Friday go out on the Sunday run."
   */
  leadTime: string | null;

  /**
   * How long after paying an order can still be changed or called off.
   *
   * e.g. "You can change or cancel any time before we press it on Sunday
   * morning."
   */
  changeWindow: string | null;

  /**
   * What happens when something is wrong with an order.
   *
   * e.g. "If anything arrives wrong or damaged, tell us within 24 hours and
   * we'll replace it on the next run or refund it."
   */
  refunds: string | null;

  /**
   * The cutoff for skipping a week or swapping flavours on a subscription.
   * The /subscribe FAQ already says "before Sunday's drop" without a time —
   * a specific one belongs here.
   *
   * e.g. "Tell us by 6pm Saturday and we'll skip that week."
   */
  subscriptionCutoff: string | null;

  /**
   * When a message actually gets answered.
   *
   * e.g. "We read messages between 9am and 9pm, seven days a week."
   */
  supportHours: string | null;
}

export const ORDER_POLICY: OrderPolicies = {
  leadTime: null,
  /* Matches the answer already published on /faq under "Can I change or
     cancel an order after I have placed it?" — set from there rather than
     independently, so the two can never say different things. */
  changeWindow:
    "You can change or cancel any time up to Thursday night, at no charge. After that the fruit for your box has already been bought against it, so get in touch as early as you can and we'll work out what's possible.",
  refunds: null,
  subscriptionCutoff: null,
  supportHours: null,
};
