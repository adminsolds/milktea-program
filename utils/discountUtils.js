// 折扣计算工具函数

/**
 * 计算折扣后的价格
 * @param {number} originalPrice - 原价
 * @param {number} discount - 折扣数（例如：100表示原价，95表示95折，80表示8折）
 * @returns {number} 折扣后的价格
 */
const calculateDiscountedPrice = (originalPrice, discount) => {
  if (!originalPrice || originalPrice <= 0) return 0;
  if (!discount || discount <= 0) return originalPrice;
  
  // 计算折扣率：折扣数 / 100
  const discountRate = discount / 100;
  
  // 计算折扣后的价格，保留两位小数
  return parseFloat((originalPrice * discountRate).toFixed(2));
};

/**
 * 计算会员折扣
 * @param {Object} user - 用户对象
 * @param {number} productTotal - 商品总价
 * @param {Array} memberLevels - 会员等级列表
 * @returns {Object} 包含会员折扣信息
 */
const calculateMemberDiscount = (user, productTotal, memberLevels) => {
  if (!user || !productTotal || productTotal <= 0) {
    return {
      discount: 0,
      discountedPrice: productTotal,
      discountRate: 100
    };
  }

  // 如果没有会员等级数据，返回原价
  if (!memberLevels || memberLevels.length === 0) {
    console.log('没有会员等级数据，返回原价');
    return {
      discount: 0,
      discountedPrice: productTotal,
      discountRate: 100
    };
  }

  // 找到用户对应的会员等级
  const memberLevel = memberLevels.find(level => level.level_id === user.member_level);
  console.log('用户会员等级:', user.member_level, '找到的等级:', memberLevel);

  // 如果找不到会员等级，返回原价
  if (!memberLevel) {
    console.log('未找到对应的会员等级，返回原价');
    return {
      discount: 0,
      discountedPrice: productTotal,
      discountRate: 100
    };
  }

  // 计算折扣后的价格
  const discountedPrice = calculateDiscountedPrice(productTotal, memberLevel.discount);

  // 计算折扣金额
  const discount = parseFloat((productTotal - discountedPrice).toFixed(2));

  console.log('会员折扣计算: 原价=' + productTotal + ', 折扣率=' + memberLevel.discount + ', 折扣金额=' + discount);

  return {
    discount,
    discountedPrice,
    discountRate: memberLevel.discount
  };
};

/**
 * 计算最终价格（考虑所有折扣）
 * @param {number} productTotal - 商品总价
 * @param {number} deliveryFee - 配送费
 * @param {number} couponDiscount - 优惠券折扣金额
 * @param {number} memberDiscount - 会员折扣金额
 * @param {boolean} hasCoupon - 是否使用了优惠券
 * @returns {number} 最终价格
 */
const calculateFinalPrice = (productTotal, deliveryFee, couponDiscount = 0, memberDiscount = 0, hasCoupon = false) => {
  // 如果使用了优惠券，则不享受会员折扣
  const actualMemberDiscount = hasCoupon ? 0 : memberDiscount;

  // 商品总价减去所有折扣，再加上配送费
  const finalPrice = productTotal - couponDiscount - actualMemberDiscount + deliveryFee;

  // 确保最终价格不小于0
  return Math.max(0, parseFloat(finalPrice.toFixed(2)));
};

module.exports = {
  calculateDiscountedPrice,
  calculateMemberDiscount,
  calculateFinalPrice
};
