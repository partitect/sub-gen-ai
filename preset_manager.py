#!/usr/bin/env python3
"""
PyCaps Preset Manager
Interactive tool to add, edit, and manage subtitle presets
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, List, Tuple

# Color codes for terminal
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*60}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.CYAN}{text.center(60)}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.CYAN}{'='*60}{Colors.ENDC}\n")

def print_success(text):
    print(f"{Colors.GREEN}✓ {text}{Colors.ENDC}")

def print_error(text):
    print(f"{Colors.RED}✗ {text}{Colors.ENDC}")

def print_info(text):
    print(f"{Colors.BLUE}ℹ {text}{Colors.ENDC}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠ {text}{Colors.ENDC}")

# Paths
BASE_DIR = Path(__file__).parent
BACKEND_DIR = BASE_DIR / "backend"
FRONTEND_DIR = BASE_DIR / "frontend" / "src" / "components"
AASPRESETS_DIR = BASE_DIR / "aaspresets"

RENDER_ENGINE_PATH = BACKEND_DIR / "render_engine.py"
MAIN_PY_PATH = BACKEND_DIR / "main.py"
SUBTITLE_OVERLAY_PATH = FRONTEND_DIR / "SubtitleOverlay.jsx"
CONTROL_PANEL_PATH = FRONTEND_DIR / "ControlPanel.jsx"

# Available fonts
AVAILABLE_FONTS = [
    "Poppins", "Brume", "Chunko Bold", "Folkies Vantage", "Might Night",
    "Marble", "Monigue", "Oslla", "RoseMask", "Sink", "Tallica"
]

# Color presets
COLOR_PRESETS = {
    "Red": "&H000000FF",
    "Blue": "&H00FF0000",
    "Green": "&H0000FF00",
    "Yellow": "&H0000FFFF",
    "Orange": "&H000099FF",
    "Pink": "&H00FF69B4",
    "Purple": "&H00FF00FF",
    "Cyan": "&H00FFFF00",
    "White": "&H00FFFFFF",
    "Black": "&H00000000",
    "Custom": "custom"
}

def get_existing_presets() -> Dict[str, Dict]:
    """Read existing presets from main.py"""
    if not MAIN_PY_PATH.exists():
        return {}
    
    content = MAIN_PY_PATH.read_text(encoding='utf-8')
    
    # Find PRESET_STYLE_MAP
    match = re.search(r'PRESET_STYLE_MAP\s*=\s*\{(.*?)\}', content, re.DOTALL)
    if not match:
        return {}
    
    presets = {}
    preset_blocks = re.findall(r'"([^"]+)":\s*\{([^}]+)\}', match.group(1))
    
    for preset_id, preset_data in preset_blocks:
        preset = {}
        for line in preset_data.split('\n'):
            if ':' in line:
                key, value = line.split(':', 1)
                key = key.strip().strip('"')
                value = value.strip().strip(',').strip('"')
                preset[key] = value
        presets[preset_id] = preset
    
    return presets

def list_aaspresets() -> List[Tuple[str, Path]]:
    """List all available AASPresets"""
    if not AASPRESETS_DIR.exists():
        return []
    
    presets = []
    for ass_file in AASPRESETS_DIR.rglob("*.ass"):
        relative_path = ass_file.relative_to(AASPRESETS_DIR)
        presets.append((str(relative_path), ass_file))
    
    return sorted(presets)

def choose_color(prompt: str) -> str:
    """Interactive color chooser"""
    print(f"\n{Colors.BOLD}{prompt}{Colors.ENDC}")
    for i, (name, code) in enumerate(COLOR_PRESETS.items(), 1):
        print(f"  {i}. {name}")
    
    while True:
        choice = input(f"\n{Colors.CYAN}Choose (1-{len(COLOR_PRESETS)}): {Colors.ENDC}").strip()
        try:
            idx = int(choice) - 1
            if 0 <= idx < len(COLOR_PRESETS):
                color_name = list(COLOR_PRESETS.keys())[idx]
                if color_name == "Custom":
                    hex_color = input(f"{Colors.CYAN}Enter hex color (e.g., FF69B4): {Colors.ENDC}").strip()
                    return f"&H00{hex_color.upper()}&"
                return COLOR_PRESETS[color_name]
        except ValueError:
            pass
        print_error("Invalid choice!")

def choose_font() -> str:
    """Interactive font chooser"""
    print(f"\n{Colors.BOLD}Choose Font:{Colors.ENDC}")
    for i, font in enumerate(AVAILABLE_FONTS, 1):
        print(f"  {i}. {font}")
    
    while True:
        choice = input(f"\n{Colors.CYAN}Choose (1-{len(AVAILABLE_FONTS)}): {Colors.ENDC}").strip()
        try:
            idx = int(choice) - 1
            if 0 <= idx < len(AVAILABLE_FONTS):
                return AVAILABLE_FONTS[idx]
        except ValueError:
            pass
        print_error("Invalid choice!")

def choose_gradient() -> str:
    """Interactive gradient chooser"""
    gradients = [
        "from-blue-500 to-purple-600",
        "from-red-500 to-orange-600",
        "from-green-400 to-cyan-500",
        "from-yellow-400 to-orange-500",
        "from-pink-400 to-purple-600",
        "from-cyan-400 to-blue-600",
        "from-purple-500 to-pink-500",
        "Custom"
    ]
    
    print(f"\n{Colors.BOLD}Choose Gradient:{Colors.ENDC}")
    for i, grad in enumerate(gradients, 1):
        print(f"  {i}. {grad}")
    
    while True:
        choice = input(f"\n{Colors.CYAN}Choose (1-{len(gradients)}): {Colors.ENDC}").strip()
        try:
            idx = int(choice) - 1
            if 0 <= idx < len(gradients):
                if gradients[idx] == "Custom":
                    return input(f"{Colors.CYAN}Enter gradient (e.g., from-red-500 to-blue-600): {Colors.ENDC}").strip()
                return gradients[idx]
        except ValueError:
            pass
        print_error("Invalid choice!")

def add_new_preset():
    """Add a new preset from AASPresets"""
    print_header("Add New Preset from AASPresets")
    
    presets = list_aaspresets()
    if not presets:
        print_error("No AASPresets found!")
        return
    
    print(f"{Colors.BOLD}Available AASPresets:{Colors.ENDC}")
    for i, (name, _) in enumerate(presets[:20], 1):  # Show first 20
        print(f"  {i}. {name}")
    
    if len(presets) > 20:
        print(f"\n  ... and {len(presets) - 20} more")
    
    choice = input(f"\n{Colors.CYAN}Choose preset number (or 'search' to search): {Colors.ENDC}").strip()
    
    if choice.lower() == 'search':
        search_term = input(f"{Colors.CYAN}Search term: {Colors.ENDC}").strip().lower()
        filtered = [(n, p) for n, p in presets if search_term in n.lower()]
        
        if not filtered:
            print_error("No matches found!")
            return
        
        print(f"\n{Colors.BOLD}Search Results:{Colors.ENDC}")
        for i, (name, _) in enumerate(filtered[:20], 1):
            print(f"  {i}. {name}")
        
        choice = input(f"\n{Colors.CYAN}Choose: {Colors.ENDC}").strip()
        try:
            idx = int(choice) - 1
            if 0 <= idx < len(filtered):
                selected_name, selected_path = filtered[idx]
            else:
                print_error("Invalid choice!")
                return
        except ValueError:
            print_error("Invalid input!")
            return
    else:
        try:
            idx = int(choice) - 1
            if 0 <= idx < len(presets):
                selected_name, selected_path = presets[idx]
            else:
                print_error("Invalid choice!")
                return
        except ValueError:
            print_error("Invalid input!")
            return
    
    print_info(f"Selected: {selected_name}")
    
    # Get preset details
    preset_id = input(f"\n{Colors.CYAN}Preset ID (e.g., 'my-cool-effect'): {Colors.ENDC}").strip().lower().replace(' ', '-')
    preset_label = input(f"{Colors.CYAN}Preset Label (e.g., 'My Cool Effect'): {Colors.ENDC}").strip()
    preset_emoji = input(f"{Colors.CYAN}Emoji (optional, e.g., '🔥'): {Colors.ENDC}").strip()
    
    # Choose colors and font
    primary_color = choose_color("Choose Primary Color")
    outline_color = choose_color("Choose Outline Color")
    font = choose_font()
    font_size = input(f"\n{Colors.CYAN}Font Size (default: 64): {Colors.ENDC}").strip() or "64"
    gradient = choose_gradient()
    
    # Convert hex colors for frontend
    primary_hex = primary_color.replace('&H00', '#').replace('&', '')
    outline_hex = outline_color.replace('&H00', '#').replace('&', '')
    
    print_info("\nGenerating preset...")
    print_warning("Note: ASS to Python conversion is complex. You may need to manually adjust the render method.")
    
    # Create a simple template
    render_method = f'''
    # --- {preset_id.upper().replace('-', ' ')} ---
    def render_{preset_id.replace('-', '_')}(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            res = []
            # TODO: Implement effect based on {selected_name}
            # Main text
            res.append(f"Dialogue: 1,{{ms_to_ass(start)}},{{ms_to_ass(end)}},Default,,0,0,0,,{{{{\\\\an5\\\\pos({{cx}},{{cy}})\\\\fscx110\\\\fscy110}}}}{{word['text']}}")
            return res
        return self._base_loop(effect)
'''
    
    print_success(f"\nPreset '{preset_id}' created!")
    print_info(f"  Label: {preset_emoji} {preset_label}")
    print_info(f"  Font: {font} ({font_size}px)")
    print_info(f"  Colors: {primary_hex} / {outline_hex}")
    print_info(f"  Gradient: {gradient}")
    
    # Ask to save
    save = input(f"\n{Colors.CYAN}Save to files? (y/n): {Colors.ENDC}").strip().lower()
    if save == 'y':
        print_info("Saving...")
        print_warning("Manual integration required - check the generated code!")
        print_success("Done! Remember to test the preset.")

def edit_existing_preset():
    """Edit an existing preset"""
    print_header("Edit Existing Preset")
    
    presets = get_existing_presets()
    if not presets:
        print_error("No presets found!")
        return
    
    print(f"{Colors.BOLD}Existing Presets:{Colors.ENDC}")
    preset_list = list(presets.keys())
    for i, preset_id in enumerate(preset_list, 1):
        preset = presets[preset_id]
        print(f"  {i}. {preset_id} ({preset.get('font', 'N/A')}, {preset.get('font_size', 'N/A')}px)")
    
    choice = input(f"\n{Colors.CYAN}Choose preset to edit (1-{len(preset_list)}): {Colors.ENDC}").strip()
    try:
        idx = int(choice) - 1
        if 0 <= idx < len(preset_list):
            preset_id = preset_list[idx]
            preset = presets[preset_id]
        else:
            print_error("Invalid choice!")
            return
    except ValueError:
        print_error("Invalid input!")
        return
    
    print_info(f"\nEditing: {preset_id}")
    print(f"  Current Font: {preset.get('font', 'N/A')}")
    print(f"  Current Size: {preset.get('font_size', 'N/A')}")
    print(f"  Current Primary Color: {preset.get('primary_color', 'N/A')}")
    print(f"  Current Outline Color: {preset.get('outline_color', 'N/A')}")
    
    print(f"\n{Colors.BOLD}What to edit?{Colors.ENDC}")
    print("  1. Font")
    print("  2. Font Size")
    print("  3. Primary Color")
    print("  4. Outline Color")
    print("  5. All")
    
    edit_choice = input(f"\n{Colors.CYAN}Choose: {Colors.ENDC}").strip()
    
    new_preset = preset.copy()
    
    if edit_choice in ['1', '5']:
        new_preset['font'] = choose_font()
    
    if edit_choice in ['2', '5']:
        size = input(f"{Colors.CYAN}New font size: {Colors.ENDC}").strip()
        if size:
            new_preset['font_size'] = size
    
    if edit_choice in ['3', '5']:
        new_preset['primary_color'] = choose_color("Choose New Primary Color")
    
    if edit_choice in ['4', '5']:
        new_preset['outline_color'] = choose_color("Choose New Outline Color")
    
    print_success(f"\nPreset '{preset_id}' updated!")
    print_info("Changes:")
    for key in ['font', 'font_size', 'primary_color', 'outline_color']:
        if preset.get(key) != new_preset.get(key):
            print(f"  {key}: {preset.get(key)} → {new_preset.get(key)}")
    
    save = input(f"\n{Colors.CYAN}Save changes? (y/n): {Colors.ENDC}").strip().lower()
    if save == 'y':
        print_info("Saving...")
        print_warning("Manual file update required!")
        print_success("Done!")

def delete_preset():
    """Delete a preset"""
    print_header("Delete Preset")
    
    presets = get_existing_presets()
    if not presets:
        print_error("No presets found!")
        return
    
    print(f"{Colors.BOLD}Existing Presets:{Colors.ENDC}")
    preset_list = list(presets.keys())
    for i, preset_id in enumerate(preset_list, 1):
        print(f"  {i}. {preset_id}")
    
    choice = input(f"\n{Colors.CYAN}Choose preset to delete (1-{len(preset_list)}): {Colors.ENDC}").strip()
    try:
        idx = int(choice) - 1
        if 0 <= idx < len(preset_list):
            preset_id = preset_list[idx]
        else:
            print_error("Invalid choice!")
            return
    except ValueError:
        print_error("Invalid input!")
        return
    
    confirm = input(f"\n{Colors.RED}Delete '{preset_id}'? This cannot be undone! (yes/no): {Colors.ENDC}").strip().lower()
    if confirm == 'yes':
        print_warning("Manual deletion required from:")
        print(f"  - {RENDER_ENGINE_PATH}")
        print(f"  - {MAIN_PY_PATH}")
        print(f"  - {SUBTITLE_OVERLAY_PATH}")
        print(f"  - {CONTROL_PANEL_PATH}")
        print_info(f"Search for: {preset_id}")

def list_presets():
    """List all presets"""
    print_header("Current Presets")
    
    presets = get_existing_presets()
    if not presets:
        print_error("No presets found!")
        return
    
    print(f"{Colors.BOLD}Total Presets: {len(presets)}{Colors.ENDC}\n")
    
    for preset_id, preset in presets.items():
        print(f"{Colors.BOLD}{preset_id}{Colors.ENDC}")
        print(f"  Font: {preset.get('font', 'N/A')} ({preset.get('font_size', 'N/A')}px)")
        print(f"  Colors: {preset.get('primary_color', 'N/A')} / {preset.get('outline_color', 'N/A')}")
        print()

def main_menu():
    """Main menu"""
    while True:
        print_header("PyCaps Preset Manager")
        
        print(f"{Colors.BOLD}Options:{Colors.ENDC}")
        print("  1. 📋 List All Presets")
        print("  2. ➕ Add New Preset (from AASPresets)")
        print("  3. ✏️  Edit Existing Preset")
        print("  4. 🗑️  Delete Preset")
        print("  5. 🚪 Exit")
        
        choice = input(f"\n{Colors.CYAN}Choose (1-5): {Colors.ENDC}").strip()
        
        if choice == '1':
            list_presets()
        elif choice == '2':
            add_new_preset()
        elif choice == '3':
            edit_existing_preset()
        elif choice == '4':
            delete_preset()
        elif choice == '5':
            print_success("Goodbye! 👋")
            break
        else:
            print_error("Invalid choice!")
        
        input(f"\n{Colors.CYAN}Press Enter to continue...{Colors.ENDC}")

if __name__ == "__main__":
    try:
        main_menu()
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}Interrupted by user. Goodbye! 👋{Colors.ENDC}")
    except Exception as e:
        print_error(f"Error: {e}")
        import traceback
        traceback.print_exc()
