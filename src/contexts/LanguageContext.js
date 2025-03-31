import React, { createContext, useState, useContext, useEffect } from 'react';

// 言語コンテキストを作成
const LanguageContext = createContext();

// 言語プロバイダーコンポーネント
export const LanguageProvider = ({ children }) => {
  // ローカルストレージから言語設定を取得するか、デフォルトで日本語を使用
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || 'ja'; // デフォルトは日本語
  });

  // 言語が変更されたらローカルストレージに保存
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // 言語を切り替える関数
  const toggleLanguage = () => {
    setLanguage(prevLang => prevLang === 'ja' ? 'en' : 'ja');
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// カスタムフック - 言語コンテキストを使用するためのフック
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};