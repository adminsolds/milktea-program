/**
 * 将奶茶订单转换为配送订单格式
 * @param {Object} milkTeaOrder - 奶茶小程序订单
 */
function convertToDeliveryOrder(milkTeaOrder) {
  // 提取商品信息
  const goodsItems = milkTeaOrder.items.map(item => {
    // 格式化规格（如：大杯/少冰/七分糖）
    const specs = [];
    if (item.size) specs.push(item.size);
    if (item.temperature) specs.push(item.temperature);
    if (item.sugar) specs.push(item.sugar);
    if (item.toppings && item.toppings.length > 0) {
      specs.push(item.toppings.join('+'));
    }

    const specText = specs.length > 0 ? `(${specs.join('/')})` : '';

    return {
      name: `${item.productName}${specText}`,
      quantity: item.quantity,
      price: item.price
    };
  });

  // 构建商品描述（用于骑手查看）
  const goodsDesc = goodsItems
    .map(item => `${item.name} x${item.quantity}`)
    .join(', ');

  return {
    // 订单号
    orderNo: milkTeaOrder.orderNo,

    // 商户信息（奶茶店）
    shopName: milkTeaOrder.shop.name,
    shopAddress: milkTeaOrder.shop.address,
    shopPhone: milkTeaOrder.shop.phone,
    shopLat: milkTeaOrder.shop.latitude,
    shopLng: milkTeaOrder.shop.longitude,

    // 客户信息
    customerName: milkTeaOrder.customer.name,
    customerPhone: milkTeaOrder.customer.phone,
    customerAddress: milkTeaOrder.customer.address,
    customerLat: milkTeaOrder.customer.latitude,
    customerLng: milkTeaOrder.customer.longitude,

    // 商品信息
    items: goodsItems,
    goodsAmount: milkTeaOrder.goodsAmount,
    deliveryFee: milkTeaOrder.deliveryFee,
    totalAmount: milkTeaOrder.totalAmount,

    // 备注（包含商品描述）
    remark: `${goodsDesc} | ${milkTeaOrder.remark || '无备注'}`
  };
}

/**
 * 将内部订单格式转换为配送订单格式
 * @param {Object} order - 内部订单对象
 * @param {Object} store - 店铺信息
 * @param {Object} user - 用户信息
 */
function convertInternalOrderToDelivery(order, store, user) {
  // 解析商品信息
  let items = [];
  try {
    if (order.items && Array.isArray(order.items)) {
      items = order.items.map(item => ({
        name: item.product_name || item.name || '商品',
        quantity: item.quantity || 1,
        price: item.price || 0
      }));
    }
  } catch (e) {
    items = [{ name: '奶茶订单', quantity: 1, price: order.product_total || 0 }];
  }

  // 构建商品描述
  const goodsDesc = items.map(item => `${item.name} x${item.quantity}`).join(', ');

  return {
    // 订单号
    orderNo: order.order_no,

    // 商户信息（奶茶店）
    shopName: store?.name || '半夏奶茶店',
    shopAddress: store?.address || '北京市朝阳区三里屯路88号',
    shopPhone: store?.phone || '010-12345678',
    shopLat: store?.latitude || 39.908692,
    shopLng: store?.longitude || 116.397477,

    // 客户信息
    customerName: user?.nickname || user?.name || '顾客',
    customerPhone: order.phone || user?.phone || '13800138000',
    customerAddress: order.address || user?.address || '北京市朝阳区xxx小区',
    customerLat: order.latitude || user?.latitude || 39.918692,
    customerLng: order.longitude || user?.longitude || 116.407477,

    // 商品信息
    items: items,
    goodsAmount: parseFloat(order.product_total) || 0,
    deliveryFee: parseFloat(order.delivery_fee) || 0,
    totalAmount: parseFloat(order.final_price) || 0,

    // 备注
    remark: `${goodsDesc} | ${order.remark || '无备注'}`
  };
}

module.exports = {
  convertToDeliveryOrder,
  convertInternalOrderToDelivery
};
