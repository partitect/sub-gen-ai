import math
import random
from typing import List, Dict

def ms_to_ass(ms: int) -> str:
    """Converts milliseconds to ASS timestamp format H:MM:SS.cc"""
    s = ms / 1000.0
    h = int(s // 3600)
    m = int((s % 3600) // 60)
    sec = int(s % 60)
    cs = int((s - int(s)) * 100)
    return f"{h}:{m:02d}:{sec:02d}.{cs:02d}"

def hex_to_ass(val: str) -> str:
    """Converts #RRGGBB to ASS &H00BBGGRR format."""
    if not val: return "&H00FFFFFF"
    if val.startswith("&H") or val.startswith("&h"): return val
    val = val.lstrip("#")
    if len(val) == 6:
        r, g, b = val[0:2], val[2:4], val[4:6]
        return f"&H00{b}{g}{r}"
    return "&H00FFFFFF"

class AdvancedRenderer:
    def __init__(self, words: List[Dict], style: Dict):
        self.words = words
        self.style = style
        self.header = self._build_header()
        
    def _build_header(self) -> str:
        font = (self.style.get("font") or "Inter").split(",")[0].strip()
        primary = hex_to_ass(self.style.get("primary_color", "&H00FFFFFF"))
        outline = hex_to_ass(self.style.get("outline_color", "&H00000000"))
        font_size = self.style.get("font_size", 60)
        
        return f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default, {font}, {font_size}, {primary}, &H000000FF, {outline}, &H00000000, -1, 0, 0, 0, 100, 100, 0, 0, 1, 2, 0, 5, 10, 10, 10, 1

"""

    def render(self) -> str:
        preset_id = self.style.get("id", "word-pop")
        method_name = f"render_{preset_id.replace('-', '_')}"
        
        if hasattr(self, method_name):
            return getattr(self, method_name)()
        else:
            return self.render_word_pop()

    def _base_loop(self, effect_func):
        lines = ["[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
        
        alignment = int(self.style.get("alignment", 2))
        screen_h = 1080
        cx = 1920 // 2
        
        if alignment == 8:
            cy = 150
        elif alignment == 5:
            cy = screen_h // 2
        else:
            cy = screen_h - 150

        for i, word in enumerate(self.words):
            start_ms = int(word['start'] * 1000)
            end_ms = int(word['end'] * 1000)
            duration = end_ms - start_ms
            
            new_lines = effect_func(word, start_ms, end_ms, duration, cx, cy)
            lines.extend(new_lines)
        return self.header + "\n".join(lines)

    # Existing methods would go here...
    # I'll add the 20 new ones at the end
    
    # --- NEW STYLES START HERE ---
    
    # 1. Matrix Rain
    def render_matrix_rain(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            res = []
            # Main text
            res.append(f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\1c&H00FF00&\\fad(100,100)}}{word['text']}")
            
            # Falling characters
            chars = "01アイウエオカキクケコ"
            for _ in range(20):
                char = random.choice(chars)
                x = cx + random.randint(-200, 200)
                y_start = cy - random.randint(200, 400)
                y_end = cy + random.randint(100, 300)
                c_start = start + random.randint(0, dur)
                c_end = c_start + random.randint(500, 1000)
                res.append(f"Dialogue: 0,{ms_to_ass(c_start)},{ms_to_ass(c_end)},Default,,0,0,0,,{{\\an5\\move({x},{y_start},{x},{y_end})\\1c&H00FF00&\\alpha&H80&\\fscx50\\fscy50\\fad(0,200)}}{char}")
            return res
        return self._base_loop(effect)

    # 2. Electric Shock
    def render_electric_shock(self) -> str:
        lightning_shape = "m 0 0 l 5 20 l -3 20 l 8 40 l -10 25 l 0 25"
        
        def effect(word, start, end, dur, cx, cy):
            res = []
            # Main text with shake
            shake = "".join([f"\\t({i*50},{(i+1)*50},\\frz{random.randint(-3,3)})" for i in range(dur//50)])
            res.append(f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\1c&HFFFF00&{shake}}}{word['text']}")
            
            # Lightning bolts
            for _ in range(8):
                lx = cx + random.randint(-80, 80)
                ly = cy + random.randint(-60, 60)
                l_start = start + random.randint(0, dur//2)
                l_end = l_start + random.randint(50, 150)
                rotation = random.randint(0, 360)
                res.append(f"Dialogue: 0,{ms_to_ass(l_start)},{ms_to_ass(l_end)},Default,,0,0,0,,{{\\an5\\pos({lx},{ly})\\frz{rotation}\\1c&HFFFF00&\\fscx80\\fscy80\\fad(0,50)\\p1}}{lightning_shape}{{\\p0}}")
            return res
        return self._base_loop(effect)

    # 3. Smoke Trail
    def render_smoke_trail(self) -> str:
        smoke_shape = "m 0 0 b 10 -5 20 -5 30 0 b 20 5 10 5 0 0"
        
        def effect(word, start, end, dur, cx, cy):
            res = []
            # Main text
            res.append(f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\fad(100,300)\\t({dur-200},{dur},\\alpha&HFF&\\blur10)}}{word['text']}")
            
            # Smoke puffs
            for _ in range(12):
                sx = cx + random.randint(-40, 40)
                sy = cy + random.randint(-20, 20)
                ey = sy - random.randint(50, 100)
                s_start = start + random.randint(dur//2, dur)
                s_end = s_start + random.randint(800, 1200)
                size = random.randint(30, 60)
                res.append(f"Dialogue: 0,{ms_to_ass(s_start)},{ms_to_ass(s_end)},Default,,0,0,0,,{{\\an5\\move({sx},{sy},{sx + random.randint(-30,30)},{ey})\\fscx{size}\\fscy{size}\\1c&HCCCCCC&\\alpha&H40&\\blur8\\t(\\alpha&HFF&\\fscx{size*2}\\fscy{size*2})\\p1}}{smoke_shape}{{\\p0}}")
            return res
        return self._base_loop(effect)

    # 4. Pixel Glitch
    def render_pixel_glitch(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            res = []
            # Multiple glitchy layers
            colors = ["&HFF0000&", "&H00FF00&", "&H0000FF&", "&HFFFFFF&"]
            for i, color in enumerate(colors):
                offset_x = random.randint(-5, 5)
                offset_y = random.randint(-3, 3)
                glitch_times = "".join([f"\\t({j*100},{(j+1)*100},\\pos({cx + random.randint(-10,10)},{cy + random.randint(-5,5)}))" for j in range(dur//100)])
                res.append(f"Dialogue: {i},{ ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx + offset_x},{cy + offset_y})\\1c{color}\\alpha&H60&{glitch_times}}}{word['text']}")
            return res
        return self._base_loop(effect)

    # 5. Neon Sign Flicker
    def render_neon_sign(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            res = []
            # Flickering effect
            flicker = ""
            t = 0
            while t < dur:
                if random.random() < 0.3:  # 30% chance to flicker
                    flicker += f"\\t({t},{t+50},\\alpha&HFF&)\\t({t+50},{t+100},\\alpha&H00&)"
                    t += 100
                else:
                    t += 100
            
            res.append(f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\1c&HFF00FF&\\3c&HFF00FF&\\bord3\\blur5{flicker}}}{word['text']}")
            return res
        return self._base_loop(effect)

    # 6-10: Group/Multi-word styles
    
    # 6. Karaoke Classic (3 words visible)
    def render_karaoke_classic(self) -> str:
        lines = ["[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
        alignment = int(self.style.get("alignment", 2))
        screen_h = 1080
        cx = 1920 // 2
        cy = screen_h - 150 if alignment == 2 else (150 if alignment == 8 else screen_h // 2)
        
        for i, word in enumerate(self.words):
            start_ms = int(word['start'] * 1000)
            end_ms = int(word['end'] * 1000)
            
            text_parts = []
            if i > 0:
                text_parts.append(f"{{\\alpha&HA0&\\fscx85\\fscy85}}{self.words[i-1]['text']}")
            text_parts.append(f"{{\\alpha&H00&\\fscx130\\fscy130\\1c&HFFFF00&\\blur4}}{word['text']}")
            if i < len(self.words) - 1:
                text_parts.append(f"{{\\alpha&HA0&\\fscx85\\fscy85}}{self.words[i+1]['text']}")
            
            full_text = " ".join(text_parts)
            lines.append(f"Dialogue: 1,{ms_to_ass(start_ms)},{ms_to_ass(end_ms)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\fad(80,80)}}{full_text}")
        
        return self.header + "\n".join(lines)

    # 7. Typewriter Line (full sentence types out)
    def render_typewriter_line(self) -> str:
        lines = ["[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
        alignment = int(self.style.get("alignment", 2))
        screen_h = 1080
        cx = 1920 // 2
        cy = screen_h - 150 if alignment == 2 else (150 if alignment == 8 else screen_h // 2)
        
        if not self.words:
            return self.header + "\n".join(lines)
        
        # Group words into sentences (every 5-8 words)
        sentence_length = 6
        for sent_start in range(0, len(self.words), sentence_length):
            sent_words = self.words[sent_start:sent_start + sentence_length]
            if not sent_words:
                continue
                
            start_ms = int(sent_words[0]['start'] * 1000)
            end_ms = int(sent_words[-1]['end'] * 1000)
            full_text = " ".join([w['text'] for w in sent_words])
            
            # Character-by-character reveal
            char_count = len(full_text)
            dur_per_char = (end_ms - start_ms) // max(char_count, 1)
            
            for i, char in enumerate(full_text):
                char_start = start_ms + i * dur_per_char
                char_end = end_ms
                revealed = full_text[:i+1]
                lines.append(f"Dialogue: 1,{ms_to_ass(char_start)},{ms_to_ass(char_end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})}}{revealed}")
        
        return self.header + "\n".join(lines)

    # 8. Fade In Out (sentence-based)
    def render_fade_in_out(self) -> str:
        lines = ["[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
        alignment = int(self.style.get("alignment", 2))
        screen_h = 1080
        cx = 1920 // 2
        cy = screen_h - 150 if alignment == 2 else (150 if alignment == 8 else screen_h // 2)
        
        sentence_length = 5
        for sent_start in range(0, len(self.words), sentence_length):
            sent_words = self.words[sent_start:sent_start + sentence_length]
            if not sent_words:
                continue
                
            start_ms = int(sent_words[0]['start'] * 1000)
            end_ms = int(sent_words[-1]['end'] * 1000)
            full_text = " ".join([w['text'] for w in sent_words])
            
            lines.append(f"Dialogue: 1,{ms_to_ass(start_ms)},{ms_to_ass(end_ms)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\fad(400,400)}}{full_text}")
        
        return self.header + "\n".join(lines)

    # 9. Slide Up
    def render_slide_up(self) -> str:
        lines = ["[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
        alignment = int(self.style.get("alignment", 2))
        screen_h = 1080
        cx = 1920 // 2
        cy = screen_h - 150 if alignment == 2 else (150 if alignment == 8 else screen_h // 2)
        
        sentence_length = 4
        for sent_start in range(0, len(self.words), sentence_length):
            sent_words = self.words[sent_start:sent_start + sentence_length]
            if not sent_words:
                continue
                
            start_ms = int(sent_words[0]['start'] * 1000)
            end_ms = int(sent_words[-1]['end'] * 1000)
            full_text = " ".join([w['text'] for w in sent_words])
            
            lines.append(f"Dialogue: 1,{ms_to_ass(start_ms)},{ms_to_ass(end_ms)},Default,,0,0,0,,{{\\an5\\move({cx},{cy + 100},{cx},{cy},0,300)\\fad(100,200)}}{full_text}")
        
        return self.header + "\n".join(lines)

    # 10. Zoom Burst
    def render_zoom_burst(self) -> str:
        lines = ["[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
        alignment = int(self.style.get("alignment", 2))
        screen_h = 1080
        cx = 1920 // 2
        cy = screen_h - 150 if alignment == 2 else (150 if alignment == 8 else screen_h // 2)
        
        sentence_length = 4
        for sent_start in range(0, len(self.words), sentence_length):
            sent_words = self.words[sent_start:sent_start + sentence_length]
            if not sent_words:
                continue
                
            start_ms = int(sent_words[0]['start'] * 1000)
            end_ms = int(sent_words[-1]['end'] * 1000)
            full_text = " ".join([w['text'] for w in sent_words])
            
            lines.append(f"Dialogue: 1,{ms_to_ass(start_ms)},{ms_to_ass(end_ms)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\fscx0\\fscy0\\t(0,300,\\fscx100\\fscy100)\\fad(0,200)}}{full_text}")
        
        return self.header + "\n".join(lines)

    # Placeholder for remaining existing methods
    def render_word_pop(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            return [f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\fscx80\\fscy80\\t(0,80,\\fscx110\\fscy110)\\t(80,150,\\fscx100\\fscy100)}}{word['text']}"]
        return self._base_loop(effect)
