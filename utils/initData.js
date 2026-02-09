const { Banner, FunctionEntry, Product, Category, ProductSpec, Coupon, GroupBuy } = require('../models');

// 初始化测试数据
const initTestData = async () => {
  try {
    console.log('开始初始化测试数据...');
    
    // 1. 检查是否已有数据
    const bannerCount = await Banner.count();
    if (bannerCount > 0) {
      console.log('数据库中已有数据，跳过初始化');
      return;
    }
    
    // 2. 创建分类
    const categories = await Category.bulkCreate([
      { name: '奶茶系列', desc: '经典奶茶', icon: '/images/categories/tea.svg', sort_order: 1 },
      { name: '果茶系列', desc: '新鲜果茶', icon: '/images/categories/fruit.svg', sort_order: 2 },
      { name: '咖啡系列', desc: '精品咖啡', icon: '/images/categories/coffee.svg', sort_order: 3 },
      { name: '小吃系列', desc: '美味小吃', icon: '/images/categories/snack.svg', sort_order: 4 }
    ]);
    
    console.log(`创建了 ${categories.length} 个分类`);
    
    // 3. 创建商品
    const products = await Product.bulkCreate([
      {
        category_id: categories[0].id,
        name: '草莓芝士奶盖',
        desc: '新鲜草莓配芝士奶盖',
        price: 20.00,
        image: '/images/products/strawberry.svg',
        tags: '新品推荐,热销',
        is_new: 1,
        is_recommended: 1
      },
      {
        category_id: categories[0].id,
        name: '杨枝甘露',
        desc: '芒果西柚椰奶',
        price: 18.00,
        image: '/images/products/mango.svg',
        tags: '经典',
        is_new: 0,
        is_recommended: 1
      },
      {
        category_id: categories[1].id,
        name: '抹茶红豆',
        desc: '日式抹茶配红豆',
        price: 16.00,
        image: '/images/products/matcha.svg',
        tags: '经典',
        is_new: 0,
        is_recommended: 0
      }
    ]);
    
    console.log(`创建了 ${products.length} 个商品`);
    
    // 4. 创建商品规格和配料
    await ProductSpec.bulkCreate([
      // 草莓芝士奶盖的规格
      { product_id: products[0].id, type: 'ice', name: '少冰', price: 0.00, is_required: 1 },
      { product_id: products[0].id, type: 'ice', name: '正常冰', price: 0.00, is_required: 1 },
      { product_id: products[0].id, type: 'ice', name: '去冰', price: 0.00, is_required: 1 },
      { product_id: products[0].id, type: 'sugar', name: '三分糖', price: 0.00, is_required: 1 },
      { product_id: products[0].id, type: 'sugar', name: '五分糖', price: 0.00, is_required: 1 },
      { product_id: products[0].id, type: 'sugar', name: '七分糖', price: 0.00, is_required: 1 },
      { product_id: products[0].id, type: 'sugar', name: '全糖', price: 0.00, is_required: 1 },
      { product_id: products[0].id, type: 'topping', name: '珍珠', price: 2.00, is_required: 0 },
      { product_id: products[0].id, type: 'topping', name: '椰果', price: 2.00, is_required: 0 },
      { product_id: products[0].id, type: 'topping', name: '布丁', price: 3.00, is_required: 0 },
      
      // 杨枝甘露的规格
      { product_id: products[1].id, type: 'ice', name: '少冰', price: 0.00, is_required: 1 },
      { product_id: products[1].id, type: 'ice', name: '正常冰', price: 0.00, is_required: 1 },
      { product_id: products[1].id, type: 'sugar', name: '三分糖', price: 0.00, is_required: 1 },
      { product_id: products[1].id, type: 'sugar', name: '五分糖', price: 0.00, is_required: 1 },
      
      // 抹茶红豆的规格
      { product_id: products[2].id, type: 'ice', name: '热饮', price: 0.00, is_required: 1 },
      { product_id: products[2].id, type: 'ice', name: '冰饮', price: 0.00, is_required: 1 },
      { product_id: products[2].id, type: 'sugar', name: '三分糖', price: 0.00, is_required: 1 },
      { product_id: products[2].id, type: 'sugar', name: '五分糖', price: 0.00, is_required: 1 },
      { product_id: products[2].id, type: 'topping', name: '红豆', price: 2.00, is_required: 0 },
      { product_id: products[2].id, type: 'topping', name: '椰果', price: 2.00, is_required: 0 }
    ]);
    
    console.log('创建了商品规格和配料');
    
    // 5. 创建轮播图
    await Banner.bulkCreate([
      {
        title: '新品上市',
        image: '/images/banners/banner1.svg',
        link: '/pages/product/product?id=1',
        position: 'home',
        sort_order: 1,
        is_active: 1
      },
      {
        title: '满20减5',
        image: '/images/banners/banner2.svg',
        link: '/pages/coupon/coupon',
        position: 'home',
        sort_order: 2,
        is_active: 1
      }
    ]);
    
    console.log('创建了轮播图');
    
    // 6. 创建功能入口
    await FunctionEntry.bulkCreate([
      {
        name: '到店自取',
        desc: '堂食 / 带走',
        type: 'takeout',
        icon: '/images/functions/takeout.png',
        link: '/pages/detail/detail',
        sort_order: 1,
        is_active: 1
      },
      {
        name: '外卖点单',
        desc: '外卖配送',
        type: 'delivery',
        icon: '/images/functions/delivery.png',
        link: '/pages/detail/detail',
        sort_order: 2,
        is_active: 1
      },
      {
        name: '储值有礼',
        desc: '储值享优惠',
        type: 'recharge',
        icon: '/images/functions/recharge.png',
        link: '/pages/recharge/recharge',
        sort_order: 3,
        is_active: 1
      },
      {
        name: '会员中心',
        desc: '积分优惠',
        type: 'member',
        icon: '/images/functions/member.png',
        link: '/pages/user/user',
        sort_order: 4,
        is_active: 1
      },
      {
        name: '积分商城',
        desc: '兑换好礼',
        type: 'points',
        icon: '/images/functions/points.png',
        link: '/pages/points/points',
        sort_order: 5,
        is_active: 1
      },
      {
        name: '团购优惠',
        desc: '堂食/带走',
        type: 'groupon',
        icon: '/images/functions/groupon.png',
        link: '/pages/groupon/groupon',
        sort_order: 6,
        is_active: 1
      }
    ]);
    
    console.log('创建了功能入口');
    
    // 7. 创建优惠券
    const now = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3);
    
    await Coupon.bulkCreate([
      {
        title: '新用户专享券',
        desc: '新用户注册即送5元无门槛券',
        amount: 5.00,
        type: 'no-threshold',
        min_amount: 0.00,
        start_time: now,
        end_time: endDate,
        is_system: 1,
        is_active: 1
      },
      {
        title: '满20减5',
        desc: '订单满20元可使用',
        amount: 5.00,
        type: 'full',
        min_amount: 20.00,
        start_time: now,
        end_time: endDate,
        is_system: 1,
        is_active: 1
      },
      {
        title: '满30减8',
        desc: '订单满30元可使用',
        amount: 8.00,
        type: 'full',
        min_amount: 30.00,
        start_time: now,
        end_time: endDate,
        is_system: 1,
        is_active: 1
      },
      {
        title: '周末特惠券',
        desc: '周末专享3元无门槛券',
        amount: 3.00,
        type: 'no-threshold',
        min_amount: 0.00,
        start_time: now,
        end_time: endDate,
        is_system: 1,
        is_active: 1
      }
    ]);

    console.log('创建了优惠券');

    // 8. 创建团购活动
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    await GroupBuy.bulkCreate([
      {
        name: '招牌珍珠奶茶双人套餐',
        desc: '包含2杯招牌珍珠奶茶 + 1份小食拼盘（珍珠+布丁）\n\n精选斯里兰卡红茶，搭配特制鲜奶，加入Q弹珍珠，口感层次丰富。小食拼盘包含经典珍珠布丁，让您享受双重美味。',
        image: '/images/banners/banner1.svg',
        images: JSON.stringify(['/images/banners/banner1.svg', '/images/banners/banner2.png']),
        original_price: 48.00,
        groupon_price: 29.90,
        min_participants: 2,
        max_participants: 50,
        current_participants: 15,
        max_purchase: 3,
        start_time: now,
        end_time: nextWeek,
        status: 'ongoing',
        sold: 156,
        rules: JSON.stringify([
          '活动时间：即日起至团购结束',
          '拼团成功：达到最低拼团人数自动成团',
          '使用方式：成团后到店出示核销码即可',
          '退款说明：活动开始前24小时可申请退款',
          '每个用户限购3份'
        ]),
        specs: JSON.stringify([
          { name: '甜度', options: ['三分糖', '五分糖', '七分糖', '全糖'] },
          { name: '冰度', options: ['去冰', '少冰', '正常冰'] },
          { name: '加料', options: ['不加料', '+珍珠 ¥2', '+椰果 ¥2', '+布丁 ¥3'], prices: [0, 2, 2, 3] }
        ]),
        sort_order: 1,
        is_active: 1
      },
      {
        name: '水果茶系列3人团购',
        desc: '任意3杯水果茶，立享团购价！\n\n精选新鲜水果，搭配优质茶底，清爽解腻，健康美味。',
        image: '/images/banners/banner1.svg',
        images: JSON.stringify(['/images/banners/banner1.svg']),
        original_price: 72.00,
        groupon_price: 39.90,
        min_participants: 3,
        max_participants: 100,
        current_participants: 8,
        max_purchase: 5,
        start_time: now,
        end_time: nextWeek,
        status: 'ongoing',
        sold: 89,
        rules: JSON.stringify([
          '活动时间：即日起至团购结束',
          '可选任意水果茶类饮品',
          '每人限购5份',
          '成团后7天内有效'
        ]),
        specs: JSON.stringify([
          { name: '冰度', options: ['少冰', '多冰', '常温'] }
        ]),
        sort_order: 2,
        is_active: 1
      },
      {
        name: '下午茶套餐5人团',
        desc: '5杯饮品 + 2份甜品拼盘\n\n适合办公室下午茶，朋友聚会分享。',
        image: '/images/banners/banner1.svg',
        original_price: 158.00,
        groupon_price: 88.00,
        min_participants: 5,
        max_participants: 20,
        current_participants: 0,
        max_purchase: 2,
        start_time: tomorrow,
        end_time: nextWeek,
        status: 'upcoming',
        sold: 0,
        rules: JSON.stringify([
          '需提前1天预约',
          '活动开始后可参团',
          '成团后3天内到店使用'
        ]),
        sort_order: 3,
        is_active: 1
      }
    ]);

    console.log('创建了团购活动');

    console.log('测试数据初始化完成！');
  } catch (error) {
    console.error('初始化测试数据失败:', error.message);
  }
};

module.exports = initTestData;