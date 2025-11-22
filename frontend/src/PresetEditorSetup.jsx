import PresetEditor from './components/PresetEditor';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Palette } from 'lucide-react';

// Add this to your main App component's return statement:
// Add a floating button to open preset editor

export function PresetEditorButton() {
    return (
        <Link
            to="/preset-editor"
            className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 transition-all hover:scale-105"
        >
            <Palette className="w-5 h-5" />
            <span className="font-semibold">Preset Editor</span>
        </Link>
    );
}

// Wrap your App with Router:
export function AppWithRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/preset-editor" element={<PresetEditor />} />
            </Routes>
        </BrowserRouter>
    );
}
