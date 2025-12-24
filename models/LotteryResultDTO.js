/**
 * 攪珠結果 DTO
 */
class LotteryResultDTO {
  constructor(data = {}) {
    this.periodNumber = data.periodNumber || '';
    this.date = data.date || '';
    this.numbers = data.numbers || [];
  }

  /**
   * 從表格行資料建立 DTO
   */
  static fromTableRow(rowData) {
    return new LotteryResultDTO({
      periodNumber: rowData.periodNumber,
      date: rowData.date,
      numbers: rowData.numbers
    });
  }

  /**
   * 轉換為 JSON
   */
  toJSON() {
    return {
      periodNumber: this.periodNumber,
      date: this.date,
      numbers: this.numbers
    };
  }
}

module.exports = LotteryResultDTO;

