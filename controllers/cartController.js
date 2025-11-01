const User = require("../models/user");
const Razorpay = require("razorpay");

const addToCart = async (req, res) => {
  const { id, title, description, image, price, category } = req.body;
  const userId = req.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "You are not authorized.",
      });
    }

    const existingProduct = user.cart.find((item) => item.id == id);
    if (existingProduct) {
      return res.status(200).json({
        success: false,
        message: "Already in cart.",
      });
    }

    const product = {
      id,
      title,
      description,
      image,
      price,
      category,
      quantity: 1,
    };

    user.cart.push(product);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Added to cart",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const userId = req.id;
    const user = await User.findById(userId);
    const itemId = req.params.id;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "You are not authorized.",
      });
    }

    const productIndex = user.cart.findIndex((item) => item.id == itemId);
    if (productIndex == -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found.",
      });
    }

    user.cart.splice(productIndex, 1);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Item removed from cart.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const incrementQuantity = async (req, res) => {
  const userId = req.id;
  const itemId = req.params.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "You are not authorized.",
      });
    }

    const productIndex = user.cart.findIndex((item) => item.id === itemId);
    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found.",
      });
    }

    user.cart[productIndex].quantity += 1;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Quantity updated.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const decrementQuantity = async (req, res) => {
  const userId = req.id;
  const itemId = req.params.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "You are not authorized.",
      });
    }

    const productIndex = user.cart.findIndex((item) => item.id === itemId);
    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found.",
      });
    }

    if (user.cart[productIndex].quantity > 1) {
      user.cart[productIndex].quantity -= 1;
      await user.save();
    } else {
      return res.status(400).json({
        success: false,
        message: "Quantity should not be less than 0.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Quantity updated",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Razorpay checkout integration
const checkOut = async (req, res) => {
  try {
    // Initialize Razorpay instance
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Calculate total amount
    const totalAmount = req.body.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Create Razorpay order
    const options = {
      amount: totalAmount * 100, // amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const clearCart = async (req, res) => {
  try {
    const userId = req.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "You are not authorized.",
      });
    }

    user.cart = [];
    await user.save();

    res.status(200).json({
      success: true,
      message: "Cart cleared.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addToCart,
  removeFromCart,
  incrementQuantity,
  decrementQuantity,
  checkOut,
  clearCart,
};
