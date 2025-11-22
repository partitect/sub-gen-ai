import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette, Type, Sliders, Save, Eye, Download, Upload, ArrowLeft, Trash2, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';
import html2canvas from 'html2canvas';

const PresetEditor = () => {
    const [presets, setPresets] = useState([]);
    const [selectedPreset, setSelectedPreset] = useState(null);
    const [editedPreset, setEditedPreset] = useState(null);
    const [previewText, setPreviewText] = useState("Sample Subtitle Text");
    const [loading, setLoading] = useState(true);
    const [previewBackground, setPreviewBackground] = useState('gradient'); // 'gradient', 'white', 'black', 'image'
    const [aasPresets, setAasPresets] = useState([]);
    const [showImportModal, setShowImportModal] = useState(false);

    // Available fonts
    const availableFonts = [
        "Poppins", "Brume", "Chunko Bold", "Folkies Vantage", "Might Night",
        "Marble", "Monigue", "Oslla", "RoseMask", "Sink", "Tallica",
        "Brown Beige", "BlackCaps", "Komika Axis", "OverHeat Regular",
        "Press Start 2P", "Thoge"
    ];

    // Load presets from backend
    useEffect(() => {
        fetchPresets();
    }, []);

    const fetchPresets = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/presets');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setPresets(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to load presets:', error);
            setLoading(false);
        }
    };

    const fetchAASPresetList = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/aaspresets/list');
            const data = await response.json();
            setAasPresets(data);
        } catch (error) {
            console.error('Failed to load AAS presets:', error);
        }
    };

    const handleImportStyle = async (path) => {
        try {
            const response = await fetch('http://localhost:8000/api/aaspresets/extract-style', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path })
            });

            if (!response.ok) throw new Error('Failed to extract style');

            const styleData = await response.json();

            let importType = 'new';

            // Only ask if we are currently editing a preset
            if (editedPreset) {
                importType = confirm("Click OK to import as a NEW preset, or Cancel to overwrite current settings.")
                    ? 'new'
                    : 'overwrite';
            }

            if (importType === 'new') {
                const defaultId = path.split('/').pop().replace('.ass', '');
                const newId = prompt("Enter ID for new preset:", defaultId);
                if (!newId) return;

                const newPreset = { ...styleData, id: newId };

                try {
                    const createResponse = await fetch('http://localhost:8000/api/presets/create', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newPreset)
                    });
                    if (!createResponse.ok) throw new Error('Failed to create preset');

                    await fetchPresets();
                    setEditedPreset(newPreset);
                    setSelectedPreset(newPreset);
                    alert('Imported as new preset!');
                } catch (e) {
                    console.error(e);
                    alert('Failed to create new preset');
                }
            } else {
                // Merge with current edited preset but keep the ID
                setEditedPreset(prev => ({
                    ...prev,
                    ...styleData,
                    id: prev.id // Keep the current ID
                }));
            }

            setShowImportModal(false);
        } catch (error) {
            console.error('Import failed:', error);
            alert('Failed to import style');
        }
    };

    const handleDelete = async () => {
        if (!editedPreset) return;
        if (!confirm(`Are you sure you want to delete "${editedPreset.id}"?`)) return;
        try {
            const response = await fetch(`http://localhost:8000/api/presets/${editedPreset.id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete');
            alert('Preset deleted successfully');
            setEditedPreset(null);
            setSelectedPreset(null);
            fetchPresets();
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete preset');
        }
    };

    const handleCapture = async () => {
        const element = document.getElementById('preview-container');
        if (!element) return;
        try {
            // Use html2canvas to capture the element
            const canvas = await html2canvas(element, {
                backgroundColor: null,
                scale: 2 // Higher resolution
            });
            const image = canvas.toDataURL("image/png");

            const response = await fetch('http://localhost:8000/api/presets/screenshot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editedPreset.id, image })
            });

            if (!response.ok) throw new Error('Failed to save screenshot');
            const result = await response.json();
            alert(`Screenshot saved! Path: ${result.path}`);
        } catch (error) {
            console.error('Screenshot failed:', error);
            alert('Failed to save screenshot');
        }
    };

    const handlePresetSelect = (preset) => {
        setSelectedPreset(preset);
        setEditedPreset({ ...preset });
    };

    const handleColorChange = (field, value) => {
        setEditedPreset(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/presets/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editedPreset)
            });
            const result = await response.json();
            alert(result.message || 'Preset saved successfully!');
            fetchPresets();
        } catch (error) {
            console.error('Failed to save preset:', error);
            alert('Failed to save preset');
        }
    };

    const handleSaveAs = async () => {
        const newId = prompt('Enter new preset ID (e.g., "my-custom-style"):', `${editedPreset.id}-copy`);
        if (!newId) return;

        const newPreset = {
            ...editedPreset,
            id: newId
        };

        try {
            const response = await fetch('http://localhost:8000/api/presets/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPreset)
            });
            const result = await response.json();
            alert(result.message || 'New preset created successfully!');
            fetchPresets();
            setSelectedPreset(newPreset);
            setEditedPreset(newPreset);
        } catch (error) {
            console.error('Failed to create preset:', error);
            alert('Failed to create preset');
        }
    };

    const hexToASS = (hex) => {
        // Convert #RRGGBB to &H00BBGGRR
        const r = hex.slice(1, 3);
        const g = hex.slice(3, 5);
        const b = hex.slice(5, 7);
        return `&H00${b}${g}${r}`.toUpperCase();
    };

    const assToHex = (ass) => {
        // Convert &H00BBGGRR to #RRGGBB
        if (!ass || !ass.includes('&H')) return '#FFFFFF';
        const hex = ass.replace('&H00', '').replace('&', '');
        if (hex.length !== 6) return '#FFFFFF';
        const b = hex.slice(0, 2);
        const g = hex.slice(2, 4);
        const r = hex.slice(4, 6);
        return `#${r}${g}${b}`.toUpperCase();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
                <div className="text-white text-2xl">Loading presets...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
            {/* Header */}
            <div className="bg-black/30 backdrop-blur-md border-b border-white/10 p-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="p-2 hover:bg-white/10 rounded-lg transition">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <Palette className="w-8 h-8 text-purple-400" />
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Preset Editor
                        </h1>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6">
                <div className="grid grid-cols-12 gap-6">
                    {/* Left Sidebar - Preset List */}
                    <div className="col-span-3">
                        <div className="bg-black/40 backdrop-blur-md rounded-xl border border-white/10 p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Type className="w-5 h-5" />
                                    Presets ({presets.length})
                                </h2>
                                <button
                                    onClick={() => {
                                        fetchAASPresetList();
                                        setShowImportModal(true);
                                    }}
                                    className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition"
                                    title="Import New Style"
                                >
                                    <Upload className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar">
                                {presets.map((preset) => (
                                    <motion.button
                                        key={preset.id}
                                        onClick={() => handlePresetSelect(preset)}
                                        className={`w-full text-left p-3 rounded-lg transition ${selectedPreset?.id === preset.id
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-white/5 hover:bg-white/10'
                                            }`}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className="font-semibold">{preset.id}</div>
                                        <div className="text-xs opacity-70">{preset.font} • {preset.font_size}px</div>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Middle - Editor */}
                    <div className="col-span-5">
                        {editedPreset ? (
                            <div className="bg-black/40 backdrop-blur-md rounded-xl border border-white/10 p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold flex items-center gap-2">
                                        <Sliders className="w-6 h-6" />
                                        Edit: {editedPreset.id}
                                    </h2>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                fetchAASPresetList();
                                                setShowImportModal(true);
                                            }}
                                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2 transition"
                                            title="Import Style"
                                        >
                                            <Upload className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={handleSaveAs}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition"
                                            title="Save As New"
                                        >
                                            <Save className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2 transition"
                                            title="Save Changes"
                                        >
                                            <Save className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 transition"
                                            title="Delete Preset"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Scrollable Controls */}
                                <div className="max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar pr-2">

                                    <div className="space-y-6">
                                        {/* === TYPOGRAPHY === */}
                                        <div className="border-b border-white/10 pb-4">
                                            <h3 className="text-sm font-bold text-purple-400 mb-3 uppercase tracking-wide">Typography</h3>

                                            {/* Font Selection */}
                                            <div className="mb-4">
                                                <label className="block text-sm font-semibold mb-2">Font Family</label>
                                                <select
                                                    value={editedPreset.font}
                                                    onChange={(e) => setEditedPreset({ ...editedPreset, font: e.target.value })}
                                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                                                >
                                                    {availableFonts.map(font => (
                                                        <option key={font} value={font} className="bg-gray-900">
                                                            {font}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Font Size */}
                                            <div className="mb-4">
                                                <label className="block text-sm font-semibold mb-2">
                                                    Font Size: {editedPreset.font_size}px
                                                </label>
                                                <input
                                                    type="range"
                                                    min="24"
                                                    max="120"
                                                    value={editedPreset.font_size}
                                                    onChange={(e) => setEditedPreset({ ...editedPreset, font_size: e.target.value })}
                                                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                                                />
                                            </div>

                                            {/* Letter Spacing */}
                                            <div className="mb-4">
                                                <label className="block text-sm font-semibold mb-2">
                                                    Letter Spacing: {editedPreset.letter_spacing || 0}px
                                                </label>
                                                <input
                                                    type="range"
                                                    min="-5"
                                                    max="20"
                                                    value={editedPreset.letter_spacing || 0}
                                                    onChange={(e) => setEditedPreset({ ...editedPreset, letter_spacing: parseInt(e.target.value) })}
                                                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                                                />
                                            </div>

                                            {/* Text Decorations */}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setEditedPreset({ ...editedPreset, bold: editedPreset.bold === 1 ? 0 : 1 })}
                                                    className={`flex-1 py-2 rounded-lg font-bold transition ${editedPreset.bold === 1 ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/60'
                                                        }`}
                                                >
                                                    Bold
                                                </button>
                                                <button
                                                    onClick={() => setEditedPreset({ ...editedPreset, italic: editedPreset.italic === 1 ? 0 : 1 })}
                                                    className={`flex-1 py-2 rounded-lg italic transition ${editedPreset.italic === 1 ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/60'
                                                        }`}
                                                >
                                                    Italic
                                                </button>
                                                <button
                                                    onClick={() => setEditedPreset({ ...editedPreset, underline: editedPreset.underline === -1 ? 0 : -1 })}
                                                    className={`flex-1 py-2 rounded-lg underline transition ${editedPreset.underline === -1 ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/60'
                                                        }`}
                                                >
                                                    Underline
                                                </button>
                                                <button
                                                    onClick={() => setEditedPreset({ ...editedPreset, strikeout: editedPreset.strikeout === -1 ? 0 : -1 })}
                                                    className={`flex-1 py-2 rounded-lg line-through transition ${editedPreset.strikeout === -1 ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/60'
                                                        }`}
                                                >
                                                    Strike
                                                </button>
                                            </div>
                                        </div>

                                        {/* === COLORS === */}
                                        <div className="border-b border-white/10 pb-4">
                                            <h3 className="text-sm font-bold text-purple-400 mb-3 uppercase tracking-wide">Colors</h3>

                                            <div className="grid grid-cols-2 gap-4">
                                                {/* Primary Color */}
                                                <div>
                                                    <label className="block text-xs font-semibold mb-2">Primary</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="color"
                                                            value={assToHex(editedPreset.primary_color)}
                                                            onChange={(e) => handleColorChange('primary_color', hexToASS(e.target.value))}
                                                            className="w-10 h-10 rounded cursor-pointer border border-white/20"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={assToHex(editedPreset.primary_color)}
                                                            onChange={(e) => handleColorChange('primary_color', hexToASS(e.target.value))}
                                                            className="flex-1 bg-white/10 border border-white/20 rounded px-2 text-xs font-mono text-white"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Secondary Color */}
                                                <div>
                                                    <label className="block text-xs font-semibold mb-2">Secondary</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="color"
                                                            value={assToHex(editedPreset.secondary_color || '&H0000FFFF')}
                                                            onChange={(e) => handleColorChange('secondary_color', hexToASS(e.target.value))}
                                                            className="w-10 h-10 rounded cursor-pointer border border-white/20"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={assToHex(editedPreset.secondary_color || '&H0000FFFF')}
                                                            onChange={(e) => handleColorChange('secondary_color', hexToASS(e.target.value))}
                                                            className="flex-1 bg-white/10 border border-white/20 rounded px-2 text-xs font-mono text-white"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Outline Color */}
                                                <div>
                                                    <label className="block text-xs font-semibold mb-2">Outline</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="color"
                                                            value={assToHex(editedPreset.outline_color)}
                                                            onChange={(e) => handleColorChange('outline_color', hexToASS(e.target.value))}
                                                            className="w-10 h-10 rounded cursor-pointer border border-white/20"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={assToHex(editedPreset.outline_color)}
                                                            onChange={(e) => handleColorChange('outline_color', hexToASS(e.target.value))}
                                                            className="flex-1 bg-white/10 border border-white/20 rounded px-2 text-xs font-mono text-white"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Shadow Color */}
                                                <div>
                                                    <label className="block text-xs font-semibold mb-2">Shadow</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="color"
                                                            value={assToHex(editedPreset.shadow_color || '&H00000000')}
                                                            onChange={(e) => handleColorChange('shadow_color', hexToASS(e.target.value))}
                                                            className="w-10 h-10 rounded cursor-pointer border border-white/20"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={assToHex(editedPreset.shadow_color || '&H00000000')}
                                                            onChange={(e) => handleColorChange('shadow_color', hexToASS(e.target.value))}
                                                            className="flex-1 bg-white/10 border border-white/20 rounded px-2 text-xs font-mono text-white"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* === EFFECTS === */}
                                        <div className="border-b border-white/10 pb-4">
                                            <h3 className="text-sm font-bold text-purple-400 mb-3 uppercase tracking-wide">Effects</h3>

                                            <div className="grid grid-cols-2 gap-4">
                                                {/* Border Width */}
                                                <div>
                                                    <label className="block text-xs font-semibold mb-1">Border: {editedPreset.border || 2}px</label>
                                                    <input
                                                        type="range" min="0" max="20"
                                                        value={editedPreset.border || 2}
                                                        onChange={(e) => setEditedPreset({ ...editedPreset, border: parseInt(e.target.value) })}
                                                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                                                    />
                                                </div>

                                                {/* Shadow Depth */}
                                                <div>
                                                    <label className="block text-xs font-semibold mb-1">Shadow: {editedPreset.shadow || 0}px</label>
                                                    <input
                                                        type="range" min="0" max="20"
                                                        value={editedPreset.shadow || 0}
                                                        onChange={(e) => setEditedPreset({ ...editedPreset, shadow: parseInt(e.target.value) })}
                                                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                                                    />
                                                </div>

                                                {/* Blur */}
                                                <div>
                                                    <label className="block text-xs font-semibold mb-1">Blur: {editedPreset.blur || 0}px</label>
                                                    <input
                                                        type="range" min="0" max="20"
                                                        value={editedPreset.blur || 0}
                                                        onChange={(e) => setEditedPreset({ ...editedPreset, blur: parseInt(e.target.value) })}
                                                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                                                    />
                                                </div>

                                                {/* Opacity */}
                                                <div>
                                                    <label className="block text-xs font-semibold mb-1">Opacity: {editedPreset.opacity || 100}%</label>
                                                    <input
                                                        type="range" min="0" max="100"
                                                        value={editedPreset.opacity || 100}
                                                        onChange={(e) => setEditedPreset({ ...editedPreset, opacity: parseInt(e.target.value) })}
                                                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* === TRANSFORM (3D & DEFORM) === */}
                                        <div className="border-b border-white/10 pb-4">
                                            <h3 className="text-sm font-bold text-purple-400 mb-3 uppercase tracking-wide">Transform & 3D</h3>

                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                {/* Scale X */}
                                                <div>
                                                    <label className="block text-xs font-semibold mb-1">Scale X: {editedPreset.scale_x || 100}%</label>
                                                    <input
                                                        type="range" min="0" max="300"
                                                        value={editedPreset.scale_x || 100}
                                                        onChange={(e) => setEditedPreset({ ...editedPreset, scale_x: parseInt(e.target.value) })}
                                                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                                                    />
                                                </div>
                                                {/* Scale Y */}
                                                <div>
                                                    <label className="block text-xs font-semibold mb-1">Scale Y: {editedPreset.scale_y || 100}%</label>
                                                    <input
                                                        type="range" min="0" max="300"
                                                        value={editedPreset.scale_y || 100}
                                                        onChange={(e) => setEditedPreset({ ...editedPreset, scale_y: parseInt(e.target.value) })}
                                                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 mb-4">
                                                {/* Rot X */}
                                                <div>
                                                    <label className="block text-[10px] font-semibold mb-1">Rot X: {editedPreset.rotation_x || 0}°</label>
                                                    <input
                                                        type="range" min="-180" max="180"
                                                        value={editedPreset.rotation_x || 0}
                                                        onChange={(e) => setEditedPreset({ ...editedPreset, rotation_x: parseInt(e.target.value) })}
                                                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                                                    />
                                                </div>
                                                {/* Rot Y */}
                                                <div>
                                                    <label className="block text-[10px] font-semibold mb-1">Rot Y: {editedPreset.rotation_y || 0}°</label>
                                                    <input
                                                        type="range" min="-180" max="180"
                                                        value={editedPreset.rotation_y || 0}
                                                        onChange={(e) => setEditedPreset({ ...editedPreset, rotation_y: parseInt(e.target.value) })}
                                                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                                                    />
                                                </div>
                                                {/* Rot Z */}
                                                <div>
                                                    <label className="block text-[10px] font-semibold mb-1">Rot Z: {editedPreset.rotation || 0}°</label>
                                                    <input
                                                        type="range" min="-180" max="180"
                                                        value={editedPreset.rotation || 0}
                                                        onChange={(e) => setEditedPreset({ ...editedPreset, rotation: parseInt(e.target.value) })}
                                                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                                                    />
                                                </div>
                                            </div>

                                            {/* Shear */}
                                            <div>
                                                <label className="block text-xs font-semibold mb-1">Shear (Skew): {editedPreset.shear || 0}</label>
                                                <input
                                                    type="range" min="-45" max="45"
                                                    value={editedPreset.shear || 0}
                                                    onChange={(e) => setEditedPreset({ ...editedPreset, shear: parseInt(e.target.value) })}
                                                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                                                />
                                            </div>
                                        </div>

                                        {/* === POSITION & MARGINS === */}
                                        <div className="pb-4">
                                            <h3 className="text-sm font-bold text-purple-400 mb-3 uppercase tracking-wide">Position</h3>

                                            {/* Alignment */}
                                            <div className="mb-4">
                                                <label className="block text-xs font-semibold mb-2">Alignment</label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(align => (
                                                        <button
                                                            key={align}
                                                            onClick={() => setEditedPreset({ ...editedPreset, alignment: align })}
                                                            className={`py-2 rounded-lg text-xs font-mono transition ${editedPreset.alignment === align ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/60'
                                                                }`}
                                                        >
                                                            {align}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Margins */}
                                            <div className="grid grid-cols-3 gap-2">
                                                <div>
                                                    <label className="block text-[10px] font-semibold mb-1">Margin L: {editedPreset.margin_l || 10}</label>
                                                    <input
                                                        type="range" min="0" max="500"
                                                        value={editedPreset.margin_l || 10}
                                                        onChange={(e) => setEditedPreset({ ...editedPreset, margin_l: parseInt(e.target.value) })}
                                                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-semibold mb-1">Margin R: {editedPreset.margin_r || 10}</label>
                                                    <input
                                                        type="range" min="0" max="500"
                                                        value={editedPreset.margin_r || 10}
                                                        onChange={(e) => setEditedPreset({ ...editedPreset, margin_r: parseInt(e.target.value) })}
                                                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-semibold mb-1">Margin V: {editedPreset.margin_v || 40}</label>
                                                    <input
                                                        type="range" min="0" max="500"
                                                        value={editedPreset.margin_v || 40}
                                                        onChange={(e) => setEditedPreset({ ...editedPreset, margin_v: parseInt(e.target.value) })}
                                                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Preview Text Input */}
                                        <div className="pt-4 border-t border-white/10">
                                            <label className="block text-sm font-semibold mb-2">Preview Text</label>
                                            <input
                                                type="text"
                                                value={previewText}
                                                onChange={(e) => setPreviewText(e.target.value)}
                                                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                                                placeholder="Enter text to preview..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-black/40 backdrop-blur-md rounded-xl border border-white/10 p-12 text-center">
                                <Eye className="w-16 h-16 mx-auto mb-4 text-white/30" />
                                <p className="text-xl text-white/50 mb-6">Select a preset to edit</p>
                                <button
                                    onClick={() => {
                                        fetchAASPresetList();
                                        setShowImportModal(true);
                                    }}
                                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg inline-flex items-center gap-2 transition font-semibold"
                                >
                                    <Upload className="w-5 h-5" />
                                    Import New Style
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right - Live Preview */}
                    <div className="col-span-4">
                        <div className="bg-black/40 backdrop-blur-md rounded-xl border border-white/10 p-6 sticky top-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Eye className="w-5 h-5" />
                                    Live Preview
                                </h2>

                                {/* Background Selector */}
                                <div className="flex gap-1 bg-black/40 rounded-lg p-1">
                                    <button
                                        onClick={() => setPreviewBackground('gradient')}
                                        className={`px-3 py-1 rounded text-xs transition ${previewBackground === 'gradient'
                                                ? 'bg-purple-600 text-white'
                                                : 'text-white/60 hover:text-white'
                                            }`}
                                        title="Gradient Background"
                                    >
                                        🌈
                                    </button>
                                    <button
                                        onClick={() => setPreviewBackground('white')}
                                        className={`px-3 py-1 rounded text-xs transition ${previewBackground === 'white'
                                                ? 'bg-purple-600 text-white'
                                                : 'text-white/60 hover:text-white'
                                            }`}
                                        title="White Background"
                                    >
                                        ⚪
                                    </button>
                                    <button
                                        onClick={() => setPreviewBackground('black')}
                                        className={`px-3 py-1 rounded text-xs transition ${previewBackground === 'black'
                                                ? 'bg-purple-600 text-white'
                                                : 'text-white/60 hover:text-white'
                                            }`}
                                        title="Black Background"
                                    >
                                        ⚫
                                    </button>
                                    <button
                                        onClick={() => setPreviewBackground('image')}
                                        className={`px-3 py-1 rounded text-xs transition ${previewBackground === 'image'
                                                ? 'bg-purple-600 text-white'
                                                : 'text-white/60 hover:text-white'
                                            }`}
                                        title="Video Background"
                                    >
                                        🎬
                                    </button>
                                    <button
                                        onClick={handleCapture}
                                        className="px-3 py-1 rounded text-xs text-white/60 hover:text-white hover:bg-white/10 transition"
                                        title="Take Screenshot"
                                    >
                                        <Camera className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {editedPreset ? (
                                <div id="preview-container" className="rounded-lg flex items-center justify-center relative overflow-hidden mx-auto" style={{ aspectRatio: '9/16', maxHeight: '600px', width: 'auto' }}>
                                    {/* Dynamic Background */}
                                    {previewBackground === 'gradient' && (
                                        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-pink-900/20 bg-black" />
                                    )}
                                    {previewBackground === 'white' && (
                                        <div className="absolute inset-0 bg-white" />
                                    )}
                                    {previewBackground === 'black' && (
                                        <div className="absolute inset-0 bg-black" />
                                    )}
                                    {previewBackground === 'image' && (
                                        <div className="absolute inset-0">
                                            <img
                                                src="/bg-captions.png"
                                                alt="Background"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}

                                    {/* Preview Text */}
                                    <div
                                        className="relative z-10 text-center px-8"
                                        style={{
                                            fontFamily: editedPreset.font,
                                            fontSize: `${Math.min(parseInt(editedPreset.font_size) * 0.4, 48)}px`,
                                            color: assToHex(editedPreset.primary_color),
                                            letterSpacing: `${(editedPreset.letter_spacing || 0) * 0.4}px`,
                                            fontWeight: editedPreset.bold === 1 ? 'bold' : 'normal',
                                            fontStyle: editedPreset.italic === 1 ? 'italic' : 'normal',
                                            textDecoration: `${editedPreset.underline === -1 ? 'underline' : ''} ${editedPreset.strikeout === -1 ? 'line-through' : ''}`.trim(),
                                            opacity: (editedPreset.opacity || 100) / 100,
                                            transform: `
                                                rotateX(${editedPreset.rotation_x || 0}deg) 
                                                rotateY(${editedPreset.rotation_y || 0}deg) 
                                                rotateZ(${editedPreset.rotation || 0}deg) 
                                                skewX(${editedPreset.shear || 0}deg) 
                                                scale(${(editedPreset.scale_x || 100) / 100}, ${(editedPreset.scale_y || 100) / 100})
                                            `,
                                            filter: `blur(${(editedPreset.blur || 0) * 0.5}px)`,
                                            textShadow: `
                                                ${editedPreset.border || 2}px ${editedPreset.border || 2}px 0 ${assToHex(editedPreset.outline_color)},
                                                -${editedPreset.border || 2}px -${editedPreset.border || 2}px 0 ${assToHex(editedPreset.outline_color)},
                                                ${editedPreset.border || 2}px -${editedPreset.border || 2}px 0 ${assToHex(editedPreset.outline_color)},
                                                -${editedPreset.border || 2}px ${editedPreset.border || 2}px 0 ${assToHex(editedPreset.outline_color)}
                                                ${editedPreset.shadow > 0 ? `, ${editedPreset.shadow * 2}px ${editedPreset.shadow * 2}px ${editedPreset.shadow * 3}px ${assToHex(editedPreset.shadow_color || '&H00000000')}` : ''}
                                            `,
                                            lineHeight: 1.4
                                        }}
                                    >
                                        {previewText}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-black rounded-lg flex items-center justify-center mx-auto" style={{ aspectRatio: '9/16', maxHeight: '600px', width: 'auto' }}>
                                    <p className="text-white/30">No preset selected</p>
                                </div>
                            )}

                            {/* Preset Info */}
                            {editedPreset && (
                                <div className="mt-6 space-y-3">
                                    <div className="bg-white/5 rounded-lg p-3">
                                        <div className="text-xs text-white/50 mb-1">Preset ID</div>
                                        <div className="font-mono text-sm">{editedPreset.id}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white/5 rounded-lg p-3">
                                            <div className="text-xs text-white/50 mb-1">Font</div>
                                            <div className="text-sm truncate">{editedPreset.font}</div>
                                        </div>
                                        <div className="bg-white/5 rounded-lg p-3">
                                            <div className="text-xs text-white/50 mb-1">Size</div>
                                            <div className="text-sm">{editedPreset.font_size}px</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white/5 rounded-lg p-3">
                                            <div className="text-xs text-white/50 mb-1">Primary</div>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-6 h-6 rounded border border-white/20"
                                                    style={{ backgroundColor: assToHex(editedPreset.primary_color) }}
                                                />
                                                <div className="text-xs font-mono">{assToHex(editedPreset.primary_color)}</div>
                                            </div>
                                        </div>
                                        <div className="bg-white/5 rounded-lg p-3">
                                            <div className="text-xs text-white/50 mb-1">Outline</div>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-6 h-6 rounded border border-white/20"
                                                    style={{ backgroundColor: assToHex(editedPreset.outline_color) }}
                                                />
                                                <div className="text-xs font-mono">{assToHex(editedPreset.outline_color)}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(147, 51, 234, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(147, 51, 234, 0.7);
        }
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #a855f7;
          cursor: pointer;
          border: 2px solid white;
        }
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #a855f7;
          cursor: pointer;
          border: 2px solid white;
        }
      `}</style>

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-white/10 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Upload className="w-5 h-5 text-purple-400" />
                                Import Style from AAS
                            </h2>
                            <button
                                onClick={() => setShowImportModal(false)}
                                className="text-white/50 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                            {aasPresets.map((preset) => (
                                <button
                                    key={preset.path}
                                    onClick={() => handleImportStyle(preset.path)}
                                    className="w-full text-left p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 hover:border-purple-500/50 transition group"
                                >
                                    <div className="font-semibold text-white group-hover:text-purple-300 transition">
                                        {preset.name}
                                    </div>
                                    <div className="text-xs text-white/40 font-mono mt-1">
                                        {preset.path}
                                    </div>
                                </button>
                            ))}

                            {aasPresets.length === 0 && (
                                <div className="text-center py-12 text-white/30">
                                    No AAS files found in aaspresets folder.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default PresetEditor;
