export const calculateBestOffer = ({ basePrice, product, category }) => {
  const now = new Date();

  let productOffer = 0;
  let categoryOffer = 0;

  if (product?.offerPercentage > 0 && (!product.offerExpiry || product.offerExpiry > now)) {
    productOffer = product.offerPercentage;
  }

  if (category?.offerValue > 0 && (!category.offerExpiry || new Date(category.offerExpiry) > now)) {
    categoryOffer = category.offerValue;
  }

  const bestOffer = Math.max(productOffer, categoryOffer);

  const finalPrice = Math.round(basePrice - (basePrice * bestOffer) / 100);

  return {
    finalPrice,
    appliedOffer: bestOffer,
  };
};
