const getDateRange = (range, startDate, endDate) => {
  let from = new Date();
  let to = new Date();

  if (range === 'daily') {
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
  } else if (range === 'weekly') {
    from.setDate(from.getDate() - 7);
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
  } else if (range === 'yearly') {
    from = new Date(new Date().getFullYear(), 0, 1);
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
  } else if (range === 'custom' && startDate && endDate) {
    from = new Date(startDate);
    from.setHours(0, 0, 0, 0);

    to = new Date(endDate);
    to.setHours(23, 59, 59, 999);
  }

  return { from, to };
};

export default getDateRange;
