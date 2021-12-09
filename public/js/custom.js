/**
 * Clientside helper functions
 */

let elements;
let email;

const STRIPE_PUB_KEY =
  'pk_test_51K2GUfH4qNskFAveMISQL1ozn4cJKrHdE29vOIjAoegCNAWNzzs54fKmEnrmNI2cnJEr6nMv0D63ChRc2NXf9XCm00aMlmOB57';

// Randomized success congratulations
const purchaseCongrats = [
  "You've got great taste!",
  "It's a page turner!",
  'Reading is life...',
  'Great choice!',
];

// JS to run on the checkout page
const handlePmtForm = async () => {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('item')) throw new Error('No item specified!');
  const item = Number(params.get('item'));
  // Create a Stripe payment intent on the server
  const res = await fetch('/create-pmt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ item: item }),
  });
  const data = await res.json();
  const { clientSecret } = data;
  const stripe = Stripe(STRIPE_PUB_KEY);
  elements = stripe.elements({ appearance: { theme: 'stripe' }, clientSecret });
  // Render the Stripe payment form
  const pmtElement = elements.create('payment');
  pmtElement.mount('#payment-element');
  // Handle click on Pay button
  document
    .getElementById('stripe-submit-pmt')
    .addEventListener('click', async (e) => {
      e.preventDefault();
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.protocol}//${window.location.host}/success?item=${item}`,
        },
      });
      if (error.type === 'card_error' || error.type === 'validation_error') {
        console.log(error.message);
      } else {
        console.log(error.message);
        console.log('Unexpected error!');
      }
    });
};

// JS to run on the success page
const handlePmtSuccess = async () => {
  // We have to be able to grab the payment intent client secret
  const params = new URLSearchParams(window.location.search);
  if (!params.has('payment_intent_client_secret'))
    throw new Error('No payment intent client secret passed!');
  const itemId = params.get('item');
  const paymentIntentClientSecret = params.get('payment_intent_client_secret');
  const stripe = Stripe(STRIPE_PUB_KEY);
  // Get the payment intent from Stripe and the item details from the backend
  const intent = await stripe.retrievePaymentIntent(paymentIntentClientSecret);
  const item = await getItem(itemId);
  // Update UI elements
  const purchTitle = document.getElementById('purchase-title');
  purchTitle.innerText =
    purchaseCongrats[Math.floor(Math.random() * purchaseCongrats.length)];
  const purchImg = document.getElementById('purchase-img');
  purchImg.src = `/images/${item.item.img}`;
  const purchDesc = document.getElementById('purchase-desc');
  purchDesc.innerText = `You just purchased ${item.item.title} for $${(
    intent.paymentIntent.amount / 100
  ).toFixed(
    2
  )}. Please allow 7 to 10 days for shipping. Thank you for supporting Stripe Press!`;
};

// Get item data from backend
const getItem = async (itemId) => {
  const res = await fetch(`/items/${itemId}`);
  return await res.json();
};

$(document).ready(function () {
  var amounts = document.getElementsByClassName('amount');

  // iterate through all "amount" elements and convert from cents to dollars
  for (var i = 0; i < amounts.length; i++) {
    amount = amounts[i].getAttribute('data-amount') / 100;
    amounts[i].innerHTML = amount.toFixed(2);
  }

  // If stripe-pmt-form element is present, we are on the checkout page
  const form = document.getElementById('stripe-pmt-form');
  if (form) {
    handlePmtForm();
    document
      .getElementById('email')
      .addEventListener('focusout', (e) => (email = e.target.value));
  }

  // If stripe-pmt-success element is present, we are on the success page
  const success = document.getElementById('stripe-pmt-success');
  if (success) {
    handlePmtSuccess();
  }
});
