import os
import re
import shutil
from pathlib import Path
from PIL import ImageFont

# Define source and destination
BACKEND_FONTS_DIR = Path(__file__).resolve().parent / "fonts"
FRONTEND_FONTS_DIR = Path(__file__).resolve().parent.parent / "frontend" / "public" / "fonts"
CSS_OUTPUT_PATH = Path(__file__).resolve().parent.parent / "frontend" / "public" / "fonts.css"

# Mapping for standard weights
WEIGHT_MAP = {
    "thin": 100, "hairline": 100,
    "extralight": 200, "extra-light": 200, "extra light": 200, "ultralight": 200, "ultra-light": 200, "ultra light": 200,
    "light": 300,
    "regular": 400, "normal": 400, "book": 400, "medium": 500,
    "semibold": 600, "semi-bold": 600, "semi bold": 600, "demibold": 600, "demi bold": 600,
    "bold": 700,
    "extrabold": 800, "extra-bold": 800, "extra bold": 800, "ultrabold": 800, "ultra-bold": 800, "ultra bold": 800, "heavy": 800,
    "black": 900, "extrablack": 950, "extra black": 950
}

def sync_directories():
    """Mirror source fonts to destination."""
    print(f"Syncing fonts from {BACKEND_FONTS_DIR} to {FRONTEND_FONTS_DIR}...")
    
    if not BACKEND_FONTS_DIR.exists():
        print(f"Error: Source directory {BACKEND_FONTS_DIR} does not exist.")
        return False

    # Create dest if it doesn't exist
    if not FRONTEND_FONTS_DIR.exists():
        FRONTEND_FONTS_DIR.mkdir(parents=True)
    else:
        # Clear destination directory
        for item in FRONTEND_FONTS_DIR.iterdir():
            if item.is_file():
                item.unlink()
            elif item.is_dir():
                shutil.rmtree(item)

    # Copy files
    count = 0
    for item in BACKEND_FONTS_DIR.iterdir():
        if item.is_file() and item.suffix.lower() in ['.ttf', '.otf']:
            shutil.copy2(item, FRONTEND_FONTS_DIR / item.name)
            count += 1
            
    print(f"Copied {count} font files.")
    return True

def parse_font_metadata(path: Path) -> dict:
    """Same parsing logic as before."""
    filename = path.name
    stem = path.stem
    
    weight = 400
    style = "normal"
    family_name = stem
    
    # Try getting metadata from PIL
    try:
        font = ImageFont.truetype(str(path), 10)
        pil_names = font.getname()
        if pil_names and len(pil_names) >= 1:
            pil_family = pil_names[0]
            if pil_family and pil_family.lower() not in ["regular", "bold", "italic"]:
                family_name = pil_family
    except Exception:
        pass

    # Regex refinement
    if re.search(r"italic|oblique", stem, re.I):
        style = "italic"
    
    lower_stem = stem.lower()
    for w_name, w_val in WEIGHT_MAP.items():
        if w_name in lower_stem:
            weight = w_val
            break
            
    clean_name = stem.replace("_", " ").replace("-", " ")
    clean_name = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", clean_name)
    clean_name = re.sub(r"(?<=[A-Z])(?=[A-Z][a-z])", " ", clean_name)
    
    remove_patterns = [r"\bitalic\b", r"\boblique\b", r"\bvariablefont\b", r"\bregular\b"]
    for w_name in sorted(WEIGHT_MAP.keys(), key=len, reverse=True):
        remove_patterns.append(rf"\b{re.escape(w_name)}\b")
        
    temp_name = clean_name
    for pat in remove_patterns:
        temp_name = re.sub(pat, "", temp_name, flags=re.I)
        
    temp_name = re.sub(r"\s+", " ", temp_name).strip()
    if temp_name.lower().endswith(" semi"):
        temp_name = temp_name[:-5]
    temp_name = temp_name.strip(" -_")

    if temp_name:
        family_name = temp_name
        
    return {
        "family": family_name,
        "weight": weight,
        "style": style,
        "filename": filename,
    }

def generate_css():
    # Use the FRONTEND directory as the source for the CSS generation,
    # as checking relative path correctness is easier.
    font_files = list(FRONTEND_FONTS_DIR.glob("*.ttf")) + list(FRONTEND_FONTS_DIR.glob("*.otf"))
    
    families = {}
    for f in font_files:
        meta = parse_font_metadata(f)
        fam = meta["family"]
        if fam not in families:
            families[fam] = []
        families[fam].append(meta)
        
    lines = ["/* Auto-generated from backend/fonts - MIRRORED Content */"]
    
    for fam_name in sorted(families.keys()):
        variants = families[fam_name]
        variants.sort(key=lambda x: (x['weight'], x['style']))
        
        # Track which weight/style combos we've emitted to avoid duplicates
        emitted = set()
        
        for v in variants:
            key_normal = (v['weight'], v['style'])
            key_bold = (700, v['style'])
            
            # Generate the standard rule
            if key_normal not in emitted:
                css_block = f"""
@font-face {{
  font-family: "{fam_name}";
  src: url("./fonts/{v['filename']}") format("truetype");
  font-weight: {v['weight']};
  font-style: {v['style']};
}}
""".strip()
                lines.append(css_block)
                emitted.add(key_normal)
            
            # ALWAYS also register for bold weight (700) if this is a normal weight font
            # This ensures JASSUB can find the font when bold is requested
            if v['weight'] == 400 and key_bold not in emitted:
                css_bold = f"""
@font-face {{
  font-family: "{fam_name}";
  src: url("./fonts/{v['filename']}") format("truetype");
  font-weight: 700;
  font-style: {v['style']};
}}
""".strip()
                lines.append(css_bold)
                emitted.add(key_bold)
            
    return "\n\n".join(lines)

if __name__ == "__main__":
    try:
        if sync_directories():
            css_content = generate_css()
            with open(CSS_OUTPUT_PATH, "w", encoding="utf-8") as f:
                f.write(css_content)
            print(f"Successfully wrote {len(css_content)} bytes to {CSS_OUTPUT_PATH}")
    except Exception as e:
        print(f"Error: {e}")
