export const wilsonScore = (p: number, t: number, p_z=2.) => {
    // 威尔逊得分计算函数
    // 参考：https://en.wikipedia.org/wiki/Binomial_proportion_confidence_interval
    // :param pos: 正例数
    // :param total: 总数
    // :param p_z: 正太分布的分位数
    // :return: 威尔逊得分
    const pos = p + 1;
    const total = t + 1;
    const pos_rat = pos * 1. / total * 1.  // 正例比率
    const score = (pos_rat + (Math.pow(p_z, 2) / (2. * total))
             - ((p_z / (2. * total)) * Math.sqrt(4. * total * (1. - pos_rat) * pos_rat + Math.pow(p_z, 2)))) /
            (1. + Math.pow(p_z, 2) / total)
    return parseFloat(score.toFixed(4))
}