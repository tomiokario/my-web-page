/**
 * CSVファイルをJSONに変換するユーティリティ
 */

import * as fs from 'fs';
import * as path from 'path';
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

  // CSVデータを行に分割
  const lines: string[] = csvData.split('\n');

  // ヘッダー行を取得し、余分な空白を削除
  const headerLine: string = lines[0];
  const headers: string[] = parseCSVLine(headerLine).map(header => header.trim());

  // 結果を格納する配列
  const result: Publication[] = [];

  // 各行を処理（ヘッダー行をスキップ）
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim(); // 行の前後の空白と改行コードを除去
    // 空行をスキップ
    if (!line) continue; // trim() した結果が空文字列ならスキップ

    try {
      // 行をCSVとして正しく解析（引用符内のカンマを考慮）
      const values: string[] = parseCSVLine(line); // trim() 済みの行を渡す

      // 値の数がヘッダーの数より少ない場合や、必要な列（名前など）がない場合はスキップ
      if (values.length < headers.length || !values[1] || values[1].trim() === '') continue;

      // 各値をヘッダーと対応させてオブジェクトを作成
      const obj: any = {}; // 一時的にanyを使用し、後でPublication型にマッピング

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

      // 各列の値をマッピング（リファクタリング前の順序を再現し、idを追加）
      // Publication型に合うようにマッピング
      const publication: Publication = {
        id: i, // idフィールドを行番号で追加
        hasEmptyFields: (values[0] || '').trim() === 'Yes',
        name: (values[1] || '').trim(),
        japanese: (values[2] || '').trim(),
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
 * CSV行を正しく解析する関数（引用符内のカンマを考慮）
 * @param {string} line - CSV行
 * @returns {string[]} - 解析された値の配列
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // 連続する引用符の場合はエスケープされた引用符として扱う
      if (i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++; // 次の引用符をスキップ
      } else {
        // 引用符の開始または終了
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // 引用符の外側のカンマは区切り文字
      result.push(current.trim()); // フィールドを配列に追加する際にtrimする
      current = '';
    } else {
      // それ以外の文字は現在の値に追加
      current += char;
    }
  }

  // 最後の値を追加
  result.push(current.trim()); // 最後の値もtrimする

  return result;
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