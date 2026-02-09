/**
 * 迁移脚本：将现有的储值记录转换为余额记录
 * 使用方法：在服务器启动后运行一次此脚本
 */

const { User, RechargeRecord, BalanceRecord } = require('../models');

async function migrateRechargeRecordsToBalanceRecords() {
  try {
    console.log('🔄 开始迁移储值记录到余额记录...');

    // 1. 检查是否已经迁移过（删除旧数据重新迁移）
    const existingBalanceRecords = await BalanceRecord.count();
    if (existingBalanceRecords > 0) {
      console.log(`⚠️  已存在 ${existingBalanceRecords} 条余额记录，删除后重新迁移`);
      await BalanceRecord.destroy({ where: {} });
      console.log('✅ 已删除旧的余额记录');
    }

    // 2. 获取所有已完成的储值记录（按创建时间排序）
    console.log('📋 正在获取储值记录...');
    const rechargeRecords = await RechargeRecord.findAll({
      where: {
        status: 'completed'
      },
      order: [['created_at', 'ASC']]
    });

    console.log(`📦 找到 ${rechargeRecords.length} 条已完成的储值记录`);

    if (rechargeRecords.length === 0) {
      console.log('ℹ️  没有需要迁移的储值记录');
      return;
    }

    // 3. 按用户分组处理储值记录
    const recordsByUser = new Map();

    for (const record of rechargeRecords) {
      const userId = record.user_id;
      if (!recordsByUser.has(userId)) {
        recordsByUser.set(userId, []);
      }
      recordsByUser.get(userId).push(record);
    }

    console.log(`👤 涉及 ${recordsByUser.size} 个用户`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // 4. 为每个用户创建余额记录（按时间顺序，累加余额）
    for (const [userId, userRecharges] of recordsByUser) {
      try {
        // 获取用户当前余额作为最终余额验证
        const user = await User.findByPk(userId);
        if (!user) {
          console.warn(`⚠️  用户 ${userId} 不存在，跳过该用户的 ${userRecharges.length} 条储值记录`);
          skipCount += userRecharges.length;
          continue;
        }

        // 计算运行余额（从0开始，按时间顺序累加）
        let runningBalance = 0;

        for (const recharge of userRecharges) {
          const rechargeAmount = parseFloat(recharge.total_amount) || 0;
          const balanceBefore = runningBalance;
          const balanceAfter = runningBalance + rechargeAmount;

          // 确定储值描述
          let description = '储值到账';
          if (recharge.remark) {
            if (recharge.remark.includes('自定义')) {
              description = '自定义储值';
            } else if (recharge.remark.includes('小程序')) {
              description = '小程序储值';
            } else if (recharge.remark.includes('管理员')) {
              description = '管理员储值';
            } else if (recharge.remark.includes('活动')) {
              description = '活动赠送';
            } else {
              description = recharge.remark;
            }
          }

          // 根据储值方式确定来源类型
          let sourceType = 'recharge';
          if (recharge.recharge_type === 'admin') {
            sourceType = 'admin';
          }

          // 创建余额记录
          await BalanceRecord.create({
            user_id: userId,
            type: 'recharge',
            amount: rechargeAmount,
            balance_before: balanceBefore,
            balance_after: balanceAfter,
            source_type: sourceType,
            source_id: recharge.id,
            description: description,
            status: 'completed',
            created_at: recharge.created_at,
            updated_at: recharge.updated_at
          });

          // 更新运行余额
          runningBalance = balanceAfter;
          successCount++;
        }

        // 验证计算出的最终余额与用户当前余额是否一致
        const finalBalance = parseFloat(user.balance) || 0;
        if (Math.abs(runningBalance - finalBalance) > 0.1) {
          console.warn(`⚠️  用户 ${userId} 计算余额 ¥${runningBalance.toFixed(2)} 与当前余额 ¥${finalBalance.toFixed(2)} 不一致`);
        } else {
          console.log(`✅ 用户 ${userId}: 迁移 ${userRecharges.length} 条记录，最终余额 ¥${runningBalance.toFixed(2)}`);
        }

      } catch (error) {
        errorCount++;
        console.error(`❌ 迁移用户 ${userId} 的记录失败:`, error.message);
      }
    }

    console.log('\n📊 迁移完成！');
    console.log(`  ✅ 成功: ${successCount} 条`);
    console.log(`  ⚠️  跳过: ${skipCount} 条`);
    console.log(`  ❌ 失败: ${errorCount} 条`);

    // 验证迁移结果
    const finalCount = await BalanceRecord.count();
    console.log(`\n📈 当前余额记录总数: ${finalCount}`);

  } catch (error) {
    console.error('❌ 迁移过程出错:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  migrateRechargeRecordsToBalanceRecords()
    .then(() => {
      console.log('✅ 迁移脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 迁移脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = migrateRechargeRecordsToBalanceRecords;
