import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from './api';

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  logoUrl: string;
  icpBeian: string;
  seoTitle: string;
  seoDescription: string;
}

const defaultSettings: SiteSettings = {
  siteName: '捷径社区',
  siteDescription: 'iOS 快捷指令分享社区',
  logoUrl: '/logo.png',
  icpBeian: '',
  seoTitle: '',
  seoDescription: '分享和发现实用的 iOS 快捷指令',
};

const SettingsContext = createContext<{
  settings: SiteSettings;
  setSettings: (s: SiteSettings) => void;
}>({ settings: defaultSettings, setSettings: () => {} });

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);

  useEffect(() => {
    api.getSettings().then(setSettings).catch((e) => {
      console.error('加载站点配置失败', e);
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
