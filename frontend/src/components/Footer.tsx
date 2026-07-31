import { useSettings } from '../SettingsContext';

export default function Footer() {
  const { settings } = useSettings();

  return (
    <footer className="border-t border-gray-200 mt-12">
      <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-gray-400 space-y-1">
        {settings.siteDescription} &copy; {new Date().getFullYear()}
        {settings.icpBeian && (
          <div>
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-500"
            >
              {settings.icpBeian}
            </a>
          </div>
        )}
      </div>
    </footer>
  );
}
