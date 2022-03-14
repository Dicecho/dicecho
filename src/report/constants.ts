export enum ReportClassification {
  // 法律
  Illegal = 'illegal', // 违反法规
  Pornographic = 'pornographic', // 色情
  Gamble = 'gamble', // 赌博诈骗

  // 侵犯个人权益
  PersonalAttack = 'personalattack', // 人身攻击
  Privacy = 'privacy', // 侵犯隐私

  // 有害社区环境
  Spam = 'spam', // 垃圾广告/刷屏

  // other
  Spoiler = 'spoiler',                // 剧透
  Invalid = 'invalid',              // 无效
}

export const REPORT_CLASSIFICATION_MAP = {
  [ReportClassification.Illegal]: '违反法规',
  [ReportClassification.Pornographic]: '淫秽色情',
  [ReportClassification.Gamble]: '赌博诈骗',
  [ReportClassification.PersonalAttack]: '人身攻击',
  [ReportClassification.Privacy]: '侵犯隐私',
  [ReportClassification.Spam]: '垃圾广告/刷屏',
  [ReportClassification.Spoiler]: '剧透',
  [ReportClassification.Invalid]: '无效',
}

export enum AppealStatus {
  Pending = 0, // 待处理
  Resolve = 1, // 已同意
  Reject = 2, // 已驳回
}

export const APPEAL_STATUS_MAP = {
  [AppealStatus.Pending]: '待处理',
  [AppealStatus.Resolve]: '已同意',
  [AppealStatus.Reject]: '已驳回',
}