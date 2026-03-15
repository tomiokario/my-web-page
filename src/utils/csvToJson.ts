/**
 * CSVファイルをJSONに変換するユーティリティ
 */

import * as fs from 'fs';
import { Publication } from '../types'; // Publication型をインポート

// 日付処理の戻り値の型定義
interface ProcessedDate {
  startDate: string;
  endDate: string;
  sortableDate: string;
}

/**
 * CSVファイルをJSONに変換する関数
 * @param {string} csvFilePath - CSVファイルのパス
 * @returns {Publication[]} - 変換されたJSONデータ
 */
export function csvToJson(csvFilePath: string): Publication[] {
  // CSVファイルを読み込む
  const csvData: string = fs.readFileSync(csvFilePath, 'utf8')
    // BOMを削除（CSVファイルの先頭に存在する可能性がある）
    .replace(/^\uFEFF/, '');

  // 引用符内改行を考慮してCSV全体をレコード単位に分解する
  const rows: string[][] = parseCSVRows(csvData);

  if (rows.length === 0) {
    return [];
  }

  // ヘッダー行を取得し、余分な空白を削除
  const headers: string[] = rows[0].map(header => header.trim());

  // 結果を格納する配列
  const result: Publication[] = [];

  // 各行を処理（ヘッダー行をスキップ）
  for (let i = 1; i < rows.length; i++) {
    try {
      const values: string[] = rows[i].map(value => value.trim());
      const rawValueCount = values.length;

      while (values.length < headers.length) {
        values.push('');
      }

      // abstract 列だけ欠けている行は許容し、それより少ない列数は不正行としてスキップする
      if (rawValueCount < headers.length - 1 || !values[1] || values[1].trim() === '') continue;

      // カンマで区切られた値を配列に変換する関数
      const processCommaSeparatedValue = (value: string | undefined | null): string | string[] => {
        const trimmedValue = (value || '').trim();
        if (trimmedValue.includes(',')) {
          return trimmedValue.split(',').map(item => item.trim());
        }
        return trimmedValue;
      };

      // 日付を開始日と終了日に分割し、ソート可能な形式に変換する関数
      const processDate = (dateString: string | undefined | null): ProcessedDate => {
        if (!dateString) return { startDate: '', endDate: '', sortableDate: '' };

        // 日付が「2021年10月3日 → 2021年10月6日」のような形式かチェック
        const dateRangeMatch = dateString.match(/(\d{4})年(\d{1,2})月(\d{1,2})日(?:\s*→\s*(\d{4})年(\d{1,2})月(\d{1,2})日)?/);

        if (dateRangeMatch) {
          // 開始日を取得
          const startYear = dateRangeMatch[1];
          const startMonth = dateRangeMatch[2].padStart(2, '0');
          const startDay = dateRangeMatch[3].padStart(2, '0');
          const startDate = `${startYear}-${startMonth}-${startDay}`;

          // 終了日を取得（存在する場合）
          let endDate = '';
          if (dateRangeMatch[4]) {
            const endYear = dateRangeMatch[4];
            const endMonth = dateRangeMatch[5].padStart(2, '0');
            const endDay = dateRangeMatch[6].padStart(2, '0');
            endDate = `${endYear}-${endMonth}-${endDay}`;
          } else {
            endDate = startDate; // 終了日がない場合は開始日と同じ
          }

          return {
            startDate,
            endDate,
            sortableDate: startDate // ソート用の日付は開始日を使用
          };
        }

        // 「2021年10月」のような年月のみの形式をチェック
        const yearMonthMatch = dateString.match(/(\d{4})年(\d{1,2})月/);
        if (yearMonthMatch) {
          const year = yearMonthMatch[1];
          const month = yearMonthMatch[2].padStart(2, '0');
          const date = `${year}-${month}-01`; // 日付は1日とする

          return {
            startDate: date,
            endDate: date,
            sortableDate: date
          };
        }

        // その他の形式の場合はそのまま返す
        return {
          startDate: dateString,
          endDate: dateString,
          sortableDate: dateString
        };
      };

      // 日付処理を実行
      const processedDate = processDate((values[9] || '').trim());
      const abstractHeaderIndex = headers.findIndex((header) =>
        ['abstract', 'Abstract', '要旨', '概要'].includes(header)
      );
      const abstractValue = abstractHeaderIndex >= 0 ? (values[abstractHeaderIndex] || '').trim() : '';

      // 各列の値をマッピング（リファクタリング前の順序を再現し、idを追加）
      // Publication型に合うようにマッピング
      const publication: Publication = {
        id: i, // idフィールドを行番号で追加
        hasEmptyFields: (values[0] || '').trim() === 'Yes',
        name: (values[1] || '').trim(),
        japanese: (values[2] || '').trim(),
        abstract: abstractValue,
        type: (values[3] || '').trim(),
        review: (values[4] || '').trim(),
        authorship: processCommaSeparatedValue(values[5]),
        presentationType: processCommaSeparatedValue(values[6]),
        doi: (values[7] || '').trim(),
        webLink: (values[8] || '').trim(),
        date: (values[9] || '').trim(),
        startDate: processedDate.startDate, // processDateの結果を適切な位置に割り当て
        endDate: processedDate.endDate,     // processDateの結果を適切な位置に割り当て
        sortableDate: processedDate.sortableDate, // processDateの結果を適切な位置に割り当て
        others: (values[10] || '').trim(),
        site: (values[11] || '').trim(),
        journalConference: (values[12] || '').trim(),
        // yearは後でusePublicationsフックで抽出するためここでは追加しない
      };

      // 結果配列に追加
      result.push(publication);
    } catch (error: any) { // エラーオブジェクトに型アノテーションを追加
      // 行の解析中にエラーが発生した場合はその行をスキップ
      console.warn(`警告: 行 ${i + 1} の解析中にエラーが発生しました。この行はスキップされます。`, error.message); // エラーメッセージを表示
    }
  }

  return result;
}

/**
 * CSV全文をレコードごとに解析する関数（引用符内の改行とカンマを考慮）
 * @param {string} csvData - CSV全体の文字列
 * @returns {string[][]} - レコードごとの値配列
 */
function parseCSVRows(csvData: string): string[][] {
  const rows: string[][] = [];
  let currentField = '';
  let currentRow: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < csvData.length; i++) {
    const char = csvData[i];
    const nextChar = csvData[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      currentRow.push(currentField);
      currentField = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField);
      if (currentRow.some(value => value.trim() !== '')) {
        rows.push(currentRow);
      }
      currentField = '';
      currentRow = [];
      continue;
    }

    currentField += char;
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some(value => value.trim() !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * CSVをJSONに変換してファイルに保存する関数
 * @param {string} csvFilePath - CSVファイルのパス
 * @param {string} jsonFilePath - 出力するJSONファイルのパス
 * @returns {boolean} - 変換が成功したかどうか
 */
export function convertAndSave(csvFilePath: string, jsonFilePath: string): boolean {
  try {
    const jsonData: Publication[] = csvToJson(csvFilePath);
    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), 'utf8');
    console.log(`変換が完了し、${jsonFilePath}に保存されました。`);
    return true;
  } catch (error: any) { // エラーオブジェクトに型アノテーションを追加
    console.error('変換中にエラーが発生しました:', error.message); // エラーメッセージを表示
    return false;
  }
}
