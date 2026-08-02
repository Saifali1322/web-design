# Running the weekly subscription

Read this before the first subscriber signs up. One item on it involves
taking money for something you did not deliver, which is the fastest way to
lose a regular customer and the hardest thing to apologise for.

## When somebody asks to skip a week, pause the payment too

The site tells customers this, on `/subscribe` and in the FAQ:

> We pause that week's drop and that week's payment, so you aren't charged
> for juice you didn't get.

**Stripe does not know a week was skipped.** The subscription bills weekly on
its own schedule whether or not a box goes out. If you only make a note to
skip the delivery, the customer is still charged, and they have paid for
nothing.

So a skip is two actions, not one:

1. Note the drop is skipped, so nothing gets pressed or packed.
2. **Pause collection on their subscription in Stripe**, before the next
   payment is taken.

In the Stripe Dashboard: **Customers → the customer → their subscription →
Actions → Pause payment collection**, and choose to resume on the date their
next drop is due. Stripe skips the invoice for the paused period and picks
the schedule back up automatically.

If a payment has already gone out before you get to it, refund that invoice
rather than carrying a credit forward. A refund is understood instantly; a
credit that has to be remembered next week is not.

## Cancelling

Cancel at period end, not immediately, unless the customer asks otherwise.
They have paid for the coming week; let them have it.

## What is not built yet

There is no customer self-service portal on the site, so every swap, skip and
cancellation arrives as a message and is carried out by you in the Stripe
Dashboard. That is workable at the current size and stops being workable
somewhere around twenty subscribers.

The fix, when it is worth doing, is Stripe's hosted Billing Customer Portal:
it gives every subscriber a link where they can pause, resume, cancel and
update their card themselves, and it removes this page's main risk, which is
that a skip depends on you remembering to do the second step.

## Test it before you go live

With Stripe in test mode, subscribe as a customer, pause collection, and
confirm on the subscription's invoice timeline that the next invoice is
genuinely skipped rather than merely delayed. Do this once, so that the first
time you pause a real subscription you already know what the screen looks
like.
