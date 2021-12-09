import os
import stripe

from dotenv import load_dotenv
from flask import Flask, request, render_template, jsonify

load_dotenv()

STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", None)
STRIPE_PUB_KEY = os.environ.get("STRIPE_PUBLISHABLE_KEY", None)

stripe.api_key = STRIPE_SECRET_KEY

if STRIPE_SECRET_KEY is None or STRIPE_PUB_KEY is None:
    raise Exception(
        "STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY must be set in .env file!"
    )

app = Flask(
    __name__,
    static_url_path="",
    template_folder=os.path.join(os.path.dirname(os.path.abspath(__file__)), "views"),
    static_folder=os.path.join(os.path.dirname(os.path.abspath(__file__)), "public"),
)

# dictionary of items so we can reuse between checkout and payment intent and
# to prevent users from modifying amount in the UI
items = [
    {
        "title": "The Art of Doing Science and Engineering",
        "amount": 2300,
        "img": "art-science-eng.jpg",
    },
    {
        "title": "The Making of Prince of Persia: Journals 1985-1993",
        "amount": 2500,
        "img": "prince-of-persia.jpg",
    },
    {
        "title": "Working in Public: The Making and Maintenance of Open Source",
        "amount": 2800,
        "img": "working-in-public.jpg",
    },
]

# Home route
@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")


# Checkout route
@app.route("/checkout", methods=["GET"])
def checkout():
    # Just hardcoding amounts here to avoid using a database
    item = int(request.args.get("item"))
    title = None
    amount = None
    error = None

    if item - 1 < 0 or item > len(items):
        error = "No item selected"
    else:
        title = items[item - 1]["title"]
        amount = items[item - 1]["amount"]

    return render_template("checkout.html", title=title, amount=amount, error=error)


@app.route("/create-pmt", methods=["POST"])
def create_pmt():
    data = request.json
    intent = stripe.PaymentIntent.create(
        amount=items[data["item"] - 1]["amount"],
        currency="usd",
        automatic_payment_methods={"enabled": True},
    )
    return jsonify({"clientSecret": intent["client_secret"]})


@app.route("/items/<int:id>", methods=["GET"])
def get_items(id):
    if id < 1 or id > len(items):
        return jsonify({"error": "Invalid item ID"})
    return jsonify({"item": items[id - 1]})


# Success route
@app.route("/success", methods=["GET"])
def success():
    return render_template("success.html")


if __name__ == "__main__":
    app.run(port=5000, host="0.0.0.0", debug=True)
