const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

/**
 * 订阅管理控制器
 */
class SubscriptionController {
  /**
   * 保存用户订阅设置
   */
  async saveSubscriptionSettings(req, res) {
    try {
      const { user_id, settings } = req.body;

      if (!user_id || !settings) {
        return res.status(400).json({
          error: '缺少必要参数'
        });
      }

      // 检查用户是否存在
      const [users] = await db.query(
        'SELECT id FROM users WHERE id = ?',
        [user_id]
      );

      if (users.length === 0) {
        return res.status(404).json({
          error: '用户不存在'
        });
      }

      // 检查是否已有订阅设置
      const [existing] = await db.query(
        'SELECT id FROM subscription_settings WHERE user_id = ?',
        [user_id]
      );

      const now = new Date();

      if (existing.length > 0) {
        // 更新现有设置
        await db.query(
          `UPDATE subscription_settings SET
            order_pickup = ?,
            order_status = ?,
            order_promotion = ?,
            order_review = ?,
            member_balance = ?,
            member_coupon_received = ?,
            member_coupon_expiring = ?,
            member_points_change = ?,
            updated_at = ?
          WHERE user_id = ?`,
          [
            settings.orderPickup ? 1 : 0,
            settings.orderStatus ? 1 : 0,
            settings.orderPromotion ? 1 : 0,
            settings.orderReview ? 1 : 0,
            settings.memberBalance ? 1 : 0,
            settings.memberCouponReceived ? 1 : 0,
            settings.memberCouponExpiring ? 1 : 0,
            settings.memberPointsChange ? 1 : 0,
            now,
            user_id
          ]
        );
      } else {
        // 插入新设置
        await db.query(
          `INSERT INTO subscription_settings (
            user_id,
            order_pickup,
            order_status,
            order_promotion,
            order_review,
            member_balance,
            member_coupon_received,
            member_coupon_expiring,
            member_points_change,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            user_id,
            settings.orderPickup ? 1 : 0,
            settings.orderStatus ? 1 : 0,
            settings.orderPromotion ? 1 : 0,
            settings.orderReview ? 1 : 0,
            settings.memberBalance ? 1 : 0,
            settings.memberCouponReceived ? 1 : 0,
            settings.memberCouponExpiring ? 1 : 0,
            settings.memberPointsChange ? 1 : 0,
            now,
            now
          ]
        );
      }

      res.json({
        success: true,
        message: '订阅设置保存成功'
      });
    } catch (error) {
      console.error('保存订阅设置失败:', error);
      res.status(500).json({
        error: '保存订阅设置失败',
        message: error.message
      });
    }
  }

  /**
   * 获取用户订阅设置
   */
  async getSubscriptionSettings(req, res) {
    try {
      const user_id = req.user.id;

      const [settings] = await db.query(
        'SELECT * FROM subscription_settings WHERE user_id = ?',
        [user_id]
      );

      if (settings.length === 0) {
        // 返回默认设置
        return res.json({
          success: true,
          settings: {
            orderPickup: true,
            orderStatus: true,
            orderPromotion: false,
            orderReview: false,
            memberBalance: true,
            memberCouponReceived: true,
            memberCouponExpiring: true,
            memberPointsChange: true
          }
        });
      }

      const setting = settings[0];

      res.json({
        success: true,
        settings: {
          orderPickup: setting.order_pickup === 1,
          orderStatus: setting.order_status === 1,
          orderPromotion: setting.order_promotion === 1,
          orderReview: setting.order_review === 1,
          memberBalance: setting.member_balance === 1,
          memberCouponReceived: setting.member_coupon_received === 1,
          memberCouponExpiring: setting.member_coupon_expiring === 1,
          memberPointsChange: setting.member_points_change === 1
        }
      });
    } catch (error) {
      console.error('获取订阅设置失败:', error);
      res.status(500).json({
        error: '获取订阅设置失败',
        message: error.message
      });
    }
  }

  /**
   * 发送订阅消息
   */
  async sendSubscriptionMessage(req, res) {
    try {
      const { user_id, template_id, data, page } = req.body;

      if (!user_id || !template_id || !data) {
        return res.status(400).json({
          error: '缺少必要参数'
        });
      }

      // 获取用户的 openid
      const [users] = await db.query(
        'SELECT openid FROM users WHERE id = ?',
        [user_id]
      );

      if (users.length === 0 || !users[0].openid) {
        return res.status(404).json({
          error: '用户不存在或未获取openid'
        });
      }

      const openid = users[0].openid;

      // 获取 access_token
      const accessToken = await this.getAccessToken();

      if (!accessToken) {
        return res.status(500).json({
          error: '获取access_token失败'
        });
      }

      // 发送订阅消息
      const result = await this.callSubscribeMessageAPI({
        access_token: accessToken
      }, {
        touser: openid,
        template_id: template_id,
        page: page || 'pages/index/index',
        data: data
      });

      if (result.errcode === 0) {
        res.json({
          success: true,
          message: '订阅消息发送成功'
        });
      } else {
        res.status(500).json({
          error: '订阅消息发送失败',
          errcode: result.errcode,
          errmsg: result.errmsg
        });
      }
    } catch (error) {
      console.error('发送订阅消息失败:', error);
      res.status(500).json({
        error: '发送订阅消息失败',
        message: error.message
      });
    }
  }

  /**
   * 获取微信 access_token
   */
  async getAccessToken() {
    try {
      const axios = require('axios');
      const config = require('../config/wechat-pay');

      const cacheKey = 'wechat_access_token';
      const cached = await this.getCache(cacheKey);

      if (cached) {
        return cached;
      }

      const response = await axios.get(
        `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.appId}&secret=${config.appSecret}`
      );

      if (response.data.access_token) {
        // 缓存 access_token，有效期 7200 秒
        await this.setCache(cacheKey, response.data.access_token, 7000);
        return response.data.access_token;
      }

      return null;
    } catch (error) {
      console.error('获取 access_token 失败:', error);
      return null;
    }
  }

  /**
   * 调用订阅消息 API
   */
  async callSubscribeMessageAPI(params, data) {
    try {
      const axios = require('axios');

      const response = await axios.post(
        `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${params.access_token}`,
        data
      );

      return response.data;
    } catch (error) {
      console.error('调用订阅消息 API 失败:', error);
      return {
        errcode: -1,
        errmsg: error.message
      };
    }
  }

  /**
   * 简单的缓存实现（可替换为 Redis）
   */
  async getCache(key) {
    // 这里应该使用 Redis 或其他缓存系统
    // 暂时返回 null，每次都重新获取
    return null;
  }

  async setCache(key, value, ttl) {
    // 这里应该使用 Redis 或其他缓存系统
    // 暂时不做任何操作
    return null;
  }

  /**
   * 批量发送订阅消息
   */
  async batchSendSubscriptionMessage(req, res) {
    try {
      const { user_ids, template_id, data, page } = req.body;

      if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
        return res.status(400).json({
          error: '用户ID列表不能为空'
        });
      }

      if (!template_id || !data) {
        return res.status(400).json({
          error: '缺少必要参数'
        });
      }

      // 获取所有用户的 openid
      const [users] = await db.query(
        'SELECT id, openid FROM users WHERE id IN (?)',
        [user_ids]
      );

      if (users.length === 0) {
        return res.status(404).json({
          error: '未找到有效用户'
        });
      }

      const accessToken = await this.getAccessToken();

      if (!accessToken) {
        return res.status(500).json({
          error: '获取access_token失败'
        });
      }

      // 批量发送消息
      const results = [];
      for (const user of users) {
        if (user.openid) {
          const result = await this.callSubscribeMessageAPI({
            access_token: accessToken
          }, {
            touser: user.openid,
            template_id: template_id,
            page: page || 'pages/index/index',
            data: data
          });

          results.push({
            user_id: user.id,
            success: result.errcode === 0,
            errcode: result.errcode,
            errmsg: result.errmsg
          });
        }
      }

      res.json({
        success: true,
        results: results
      });
    } catch (error) {
      console.error('批量发送订阅消息失败:', error);
      res.status(500).json({
        error: '批量发送订阅消息失败',
        message: error.message
      });
    }
  }
}

module.exports = new SubscriptionController();
