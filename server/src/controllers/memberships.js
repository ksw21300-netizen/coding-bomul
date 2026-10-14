import User from '../models/User.js';

const PAYMENTS = ['신용카드', '계좌이체', '네이버페이'];
export const MEMBERSHIP_PRICE = 9900;

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export function getMembership(req, res) {
  res.json({
    title: '전설 코스 멤버십',
    price: MEMBERSHIP_PRICE,
    payments: PAYMENTS,
  });
}

export async function buyMembership(req, res) {
  const payment = typeof req.body.payment_method === 'string' ? req.body.payment_method.trim() : '';
  if (!PAYMENTS.includes(payment)) throw httpError(400, '결제수단을 선택해 주세요.');

  const user = await User.findById(req.user.id);
  if (!user) throw httpError(401, '토큰이 올바르지 않습니다.');
  if (!user.membership?.active) {
    user.membership = {
      active: true,
      purchased_at: new Date(),
      payment_method: payment,
    };
    await user.save();
  }

  res.json({
    message: '멤버십을 구매했습니다.',
    price: MEMBERSHIP_PRICE,
    membership: user.membership,
  });
}
