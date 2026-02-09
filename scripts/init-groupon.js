const { GroupBuy } = require('../models');
const sequelize = require('../config/db').sequelize;

// 初始化团购数据
const initGrouponData = async () => {
  try {
    console.log('开始初始化团购数据...');

    // 检查是否已有团购数据
    const count = await GroupBuy.count();
    if (count > 0) {
      console.log(`数据库中已有 ${count} 条团购数据，跳过初始化`);
      return;
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    await GroupBuy.bulkCreate([
      {
        name: '招牌珍珠奶茶双人套餐',
        desc: '包含2杯招牌珍珠奶茶 + 1份小食拼盘（珍珠+布丁）\n\n精选斯里兰卡红茶，搭配特制鲜奶，加入Q弹珍珠，口感层次丰富。小食拼盘包含经典珍珠布丁，让您享受双重美味。',
        image: '/uploads/image-1768924656324-325242697.png',
        images: JSON.stringify(['/uploads/image-1768924656324-325242697.png']),
        product_ids: JSON.stringify([1, 2]),
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
        image: '/uploads/image-1768925136744-44366864.png',
        images: JSON.stringify(['/uploads/image-1768925136744-44366864.png']),
        product_ids: JSON.stringify([2, 3]),
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
        image: '/uploads/image-1768924656324-325242697.png',
        images: JSON.stringify(['/uploads/image-1768924656324-325242697.png']),
        product_ids: JSON.stringify([1, 2, 3]),
        original_price: 158.00,
        groupon_price: 88.00,
        min_participants: 5,
        max_participants: 20,
        current_participants: 3,
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
        specs: JSON.stringify([
          { name: '套餐', options: ['标准套餐', '豪华套餐'] }
        ]),
        sort_order: 3,
        is_active: 1
      },
      {
        name: '杨枝甘露新品试尝团',
        desc: '杨枝甘露新品上市，2人团购尝鲜价\n\n新鲜芒果搭配西柚和椰奶，口感丰富。',
        image: '/uploads/image-1768925136744-44366864.png',
        images: JSON.stringify(['/uploads/image-1768925136744-44366864.png']),
        product_ids: JSON.stringify([2]),
        original_price: 36.00,
        groupon_price: 19.90,
        min_participants: 2,
        max_participants: 50,
        current_participants: 42,
        max_purchase: 3,
        start_time: now,
        end_time: nextWeek,
        status: 'ongoing',
        sold: 234,
        rules: JSON.stringify([
          '新品尝鲜价',
          '每人限购3份',
          '成团后7天内有效'
        ]),
        specs: JSON.stringify([
          { name: '冰度', options: ['少冰', '正常冰'] }
        ]),
        sort_order: 4,
        is_active: 1
      }
    ]);

    console.log('团购数据初始化完成！创建了 4 条团购活动');
    process.exit(0);
  } catch (error) {
    console.error('初始化团购数据失败:', error.message);
    process.exit(1);
  }
};

// 运行初始化
initGrouponData();
