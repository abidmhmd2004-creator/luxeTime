export const validateCartForCheckout = (cart) => {
  const errors = [];

  if (!cart || cart.items.length === 0) {
    return {
      valid: false,
      errors: ["Your cart is empty"],
    };
  }

  for (const item of cart.items) {
    const product = item.product;
    const variant = item.variant;

    if (!product) {
      errors.push("A product in your cart no longer exists");
      continue;
    }

    if (!product.isActive) {
      errors.push(`${product.name} is no longer available`);
      continue;
    }

    if (!variant) {
      errors.push(`Variant for ${product.name} no longer exists`);
      continue;
    }

    if (!variant.isActive) {
      errors.push(`Selected variant of ${product.name} is unavailable`);
      continue;
    }

    if (variant.stock < item.quantity) {
      errors.push(
        `Only ${variant.stock} left for ${product.name}. Please update your cart`,
      );
    }
    if (product.category && !product.category.isListed) {
      errors.push(`${product.name} category is unavailable`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
